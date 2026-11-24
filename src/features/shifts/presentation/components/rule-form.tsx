import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { formatBRL } from '@/shared/domain/money';
import { errorMessage } from '@/shared/presentation/use-command';
import { Button } from '@/shared/ui/button';
import { ErrorNote } from '@/shared/ui/feedback';
import { Chip, Field } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

import { KNOWN_BANKS, type KnownBank } from '../../domain/known-banks';
import type { NotificationRule } from '../../domain/notification-rule';
import { parseBrlToCents } from '../../domain/parse-pix-notification';
import {
  buildSimpleRule,
  draftForPackage,
  OTHER_APP,
  suggestRuleName,
  type SimpleRuleDraft,
} from '../../domain/simple-rule';
import { useDeleteNotificationRule, useSaveNotificationRule } from '../hooks';

/** What the new-rule form starts with, taken from an unrecognized notification. */
export type RulePrefill = { packageName: string; example: string };

const bankOf = (bankId: string | null): KnownBank | null => KNOWN_BANKS.find((b) => b.id === bankId) ?? null;

/**
 * Creates a notification rule, or edits one when `rule` is given, or starts from `prefill`.
 * Simple mode asks the bank and a pasted example; the app builds the pattern. Advanced mode (collapsed by
 * default) shows the package, title and text pattern. The use case validates what is saved and closes the
 * form once saved or deleted.
 */
export function RuleForm({
  rule,
  prefill,
  onDone,
}: {
  rule?: NotificationRule;
  prefill?: RulePrefill;
  onDone: () => void;
}) {
  const colors = useThemeColors();
  const [draft, setDraft] = useState<SimpleRuleDraft>(() => {
    if (rule) return { ...draftForPackage(rule.packageName, ''), name: rule.name };
    const start = draftForPackage(prefill?.packageName ?? '', prefill?.example ?? '');
    return { ...start, name: suggestRuleName(bankOf(start.bankId)) };
  });
  const [titlePattern, setTitlePattern] = useState(rule?.titlePattern ?? '');
  // The text pattern typed in advanced mode. Null while the example decides it.
  const [textOverride, setTextOverride] = useState<string | null>(rule?.textPattern ?? null);
  const [advancedOpen, setAdvancedOpen] = useState(!!rule);
  const [showErrors, setShowErrors] = useState(false);
  const save = useSaveNotificationRule();
  const remove = useDeleteNotificationRule();

  const built = buildSimpleRule(draft);
  // With a typed pattern the example is not needed; the package still is.
  const blocking = textOverride !== null && built.packageName ? null : built.error;
  const textValue = textOverride ?? built.textPattern;
  const packageValue = draft.bankId === OTHER_APP ? draft.customPackage : built.packageName;

  const pickBank = (bankId: string) => {
    const previous = suggestRuleName(bankOf(draft.bankId));
    const next = suggestRuleName(bankOf(bankId));
    setDraft((d) => ({
      ...d,
      bankId,
      name: d.name.trim() === '' || d.name === previous ? next : d.name,
    }));
  };

  const changeExample = (example: string) => {
    setDraft((d) => ({ ...d, example }));
    setTextOverride(null);
  };

  const changePackage = (customPackage: string) => {
    setDraft((d) => ({ ...d, bankId: OTHER_APP, customPackage }));
  };

  const submit = () => {
    setShowErrors(true);
    if (blocking) return;
    save.mutate(
      {
        id: rule?.id,
        input: {
          name: built.name,
          packageName: built.packageName,
          titlePattern: titlePattern.trim() || null,
          textPattern: textValue,
        },
      },
      { onSuccess: onDone },
    );
  };

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
  const message = (showErrors ? blocking : null) ?? (error ? errorMessage(error) : null);

  return (
    <View className="gap-5">
      <Text variant="muted">
        Uma regra diz de qual banco sai o valor de um Pix recebido. Regras desligadas são ignoradas.
      </Text>

      <Field label="De qual banco?">
        <View className="flex-row flex-wrap gap-2">
          {KNOWN_BANKS.map((bank) => (
            <Chip
              key={bank.id}
              label={bank.name}
              selected={draft.bankId === bank.id}
              onPress={() => pickBank(bank.id)}
            />
          ))}
          <Chip label="Outro app" selected={draft.bankId === OTHER_APP} onPress={() => pickBank(OTHER_APP)} />
        </View>
      </Field>

      {draft.bankId === OTHER_APP && !advancedOpen && (
        <Field label="Pacote do app" hint="Nome técnico do app. Por exemplo: com.nu.production.">
          <Input
            value={draft.customPackage}
            onChangeText={changePackage}
            placeholder="com.nu.production"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Field>
      )}

      <Field
        label="Cole um exemplo da notificação de Pix recebido"
        hint="Copie como aparece no celular, com o valor e o nome de quem pagou."
      >
        <Input
          value={draft.example}
          onChangeText={changeExample}
          placeholder="Você recebeu um Pix de R$ 25,00 de Fulano."
          multiline
          textAlignVertical="top"
          className="h-auto min-h-[96px] py-3 text-sm"
        />
      </Field>

      {draft.example.trim() !== '' &&
        (built.example.ok ? (
          <Text className="font-sans-semibold text-income">
            Valor reconhecido: {formatBRL(parseBrlToCents(built.example.amountText) ?? 0)}
          </Text>
        ) : (
          <Text className="text-expense">{built.example.error}</Text>
        ))}

      <Field label="Nome da regra" hint="Como você quer reconhecer a regra.">
        <Input
          value={draft.name}
          onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
          placeholder="Pix do Nubank"
          maxLength={60}
        />
      </Field>

      <Pressable
        onPress={() => setAdvancedOpen((open) => !open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: advancedOpen }}
        className="flex-row items-center justify-between py-2 active:opacity-70">
        <Text className="font-sans-semibold">Modo avançado</Text>
        {advancedOpen ? (
          <ChevronUp size={18} color={colors.iconMuted} strokeWidth={2} />
        ) : (
          <ChevronDown size={18} color={colors.iconMuted} strokeWidth={2} />
        )}
      </Pressable>

      {advancedOpen && (
        <View className="gap-5">
          <Field label="Pacote do app" hint="Nome técnico do app que envia a notificação.">
            <Input
              value={packageValue}
              onChangeText={changePackage}
              placeholder="com.nu.production"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Field>

          <Field label="Padrão do título (opcional)" hint="Um trecho que o título precisa ter. Deixe vazio para aceitar qualquer título.">
            <Input
              value={titlePattern}
              onChangeText={setTitlePattern}
              placeholder="Pix recebido"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Field>

          <Field
            label="Padrão do texto"
            hint="Gerado a partir do exemplo. Use (?<valor>...) no lugar do número e (?<pagador>...) para quem pagou."
          >
            <Input
              value={textValue}
              onChangeText={setTextOverride}
              autoCapitalize="none"
              autoCorrect={false}
              className="font-mono"
            />
          </Field>
        </View>
      )}

      <ErrorNote message={message} />

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
