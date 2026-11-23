import { useState } from 'react';
import { Alert, View } from 'react-native';

import { errorMessage } from '@/shared/presentation/use-command';
import { Button } from '@/shared/ui/button';
import { ErrorNote } from '@/shared/ui/feedback';
import { Field } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Text } from '@/shared/ui/text';

import type { NotificationRule } from '../../domain/notification-rule';
import { useDeleteNotificationRule, useSaveNotificationRule } from '../hooks';

const NUBANK_PACKAGE = 'com.nu.production';

/**
 * Creates a notification rule, or edits one when `rule` is given. The use case validates the patterns
 * and returns the message to show; it closes itself once saved or deleted.
 */
export function RuleForm({ rule, onDone }: { rule?: NotificationRule; onDone: () => void }) {
  const [name, setName] = useState(rule?.name ?? '');
  const [packageName, setPackageName] = useState(rule?.packageName ?? '');
  const [titlePattern, setTitlePattern] = useState(rule?.titlePattern ?? '');
  const [textPattern, setTextPattern] = useState(rule?.textPattern ?? '');
  const save = useSaveNotificationRule();
  const remove = useDeleteNotificationRule();

  const submit = () =>
    save.mutate(
      {
        id: rule?.id,
        input: { name, packageName, titlePattern: titlePattern.trim() || null, textPattern },
      },
      { onSuccess: onDone },
    );

  const confirmDelete = () => {
    if (!rule) return;
    Alert.alert('Apagar regra', `A regra "${rule.name}" deixa de captar notificações.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: () => remove.mutate(rule.id, { onSuccess: onDone }),
      },
    ]);
  };

  const error = save.error ?? remove.error;

  return (
    <View className="gap-5">
      <Text variant="muted">
        Uma regra diz de qual app e de qual texto sai o valor de um Pix. Regras desligadas são ignoradas.
      </Text>

      <Field label="Nome" hint="Como você quer reconhecer a regra. Ex.: Pix do Nubank.">
        <Input value={name} onChangeText={setName} placeholder="Pix do Nubank" maxLength={60} />
      </Field>

      <Field label="Pacote do app" hint="Nome técnico do app que envia a notificação. O do Nubank é com.nu.production.">
        <Input
          value={packageName}
          onChangeText={setPackageName}
          placeholder={NUBANK_PACKAGE}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Field>

      <Field label="Padrão do título (opcional)" hint="Um trecho que o título precisa ter. Deixe vazio para aceitar qualquer título.">
        <Input value={titlePattern} onChangeText={setTitlePattern} placeholder="Pix recebido" autoCapitalize="none" autoCorrect={false} />
      </Field>

      <Field
        label="Padrão do texto"
        hint="Coloque (?<valor>...) no lugar do número. O grupo valor captura o valor. Use (?<pagador>...) para capturar quem pagou."
      >
        <Input
          value={textPattern}
          onChangeText={setTextPattern}
          placeholder="recebeu um Pix de R\$ (?<valor>[\d.,]+)"
          autoCapitalize="none"
          autoCorrect={false}
          className="font-mono"
        />
      </Field>

      <ErrorNote message={error ? errorMessage(error) : null} />

      <Button size="lg" loading={save.isPending} onPress={submit}>
        <Text>Salvar regra</Text>
      </Button>

      {rule && (
        <Button variant="destructive" loading={remove.isPending} onPress={confirmDelete}>
          <Text className="text-expense">Apagar regra</Text>
        </Button>
      )}
    </View>
  );
}
