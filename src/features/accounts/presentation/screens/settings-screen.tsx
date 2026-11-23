import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  Bell,
  ChevronRight,
  CircleCheck,
  CreditCard,
  Download,
  HardDrive,
  Info,
  Landmark,
  Palette,
  Plus,
  RefreshCw,
  Tags,
  Upload,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { useReminderSync } from '@/features/bills/presentation/hooks';
import { useExportBackup, useImportBackup } from '@/features/backup/presentation/hooks';
import { useProfile } from '@/features/profile/presentation/hooks';
import { useThemePreference, type ThemePreference } from '@/shared/presentation/theme-preference';
import { errorMessage } from '@/shared/presentation/use-command';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { IconTile } from '@/shared/ui/category-badge';
import { ErrorNote } from '@/shared/ui/feedback';
import { Illustration } from '@/shared/ui/illustration';
import { ListRow, ListSection } from '@/shared/ui/list';
import { Money } from '@/shared/ui/money';
import { Screen } from '@/shared/ui/screen';
import { Segmented } from '@/shared/ui/segmented';
import { Pill, Surface } from '@/shared/ui/surface';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

import { ACCOUNT_TYPE_LABEL, type AccountType } from '../../domain/account';
import { useBalances } from '../hooks';

type SettingsSection = 'hub' | 'appearance' | 'accounts' | 'reminders' | 'backup' | 'about';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'dark', label: 'Escuro' },
  { value: 'light', label: 'Claro' },
  { value: 'system', label: 'Sistema' },
];

const ACCOUNT_ICON: Record<AccountType, typeof Landmark> = {
  checking: Landmark,
  credit_card: CreditCard,
  cash: Landmark,
};

export function SettingsScreen() {
  const [section, setSection] = useState<SettingsSection>('hub');

  switch (section) {
    case 'appearance':
      return <AppearanceSection onBack={() => setSection('hub')} />;
    case 'accounts':
      return <AccountsSection onBack={() => setSection('hub')} />;
    case 'reminders':
      return <RemindersSection onBack={() => setSection('hub')} />;
    case 'backup':
      return <BackupSection onBack={() => setSection('hub')} />;
    case 'about':
      return <AboutSection onBack={() => setSection('hub')} />;
    default:
      return <SettingsHub onNavigate={setSection} />;
  }
}

/**
 * Modern Android-inspired Settings Hub: clean categories, prominent icons,
 * and simple human descriptions for quick understanding.
 */
function SettingsHub({ onNavigate }: { onNavigate: (s: SettingsSection) => void }) {
  const colors = useThemeColors();
  const balances = useBalances();
  const [theme] = useThemePreference();
  const profile = useProfile();
  const chevron = <ChevronRight size={18} color={colors.iconMuted} />;

  const themeLabel = theme === 'dark' ? 'Escuro' : theme === 'light' ? 'Claro' : 'Sistema';
  const accountsCount = balances.data?.length ?? 0;

  return (
    <Screen back title="Ajustes">
      {/* Primeira linha: o próprio perfil */}
      <ListSection>
        <ListRow
          leading={<Avatar name={profile.data?.name ?? ''} photoUri={profile.data?.photoUri} size={40} />}
          title={profile.data?.name || 'Seu perfil'}
          subtitle="Editar perfil"
          trailing={chevron}
          onPress={() => router.push('/perfil')}
        />
      </ListSection>

      {/* Header card no estilo Android */}
      <Surface tone="raised" className="flex-row items-center justify-between p-5">
        <View className="flex-1 gap-1">
          <Text variant="heading">Preferências do Rumo</Text>
          <Text variant="muted">Dados salvos de forma privada neste celular.</Text>
        </View>
        <Illustration name="plan" size={68} />
      </Surface>

      {/* Seção 1: Personalização e Sistema */}
      <ListSection title="Personalização">
        <ListRow
          leading={
            <IconTile>
              <Palette size={19} color={colors.accent} strokeWidth={2} />
            </IconTile>
          }
          title="Aparência"
          subtitle="Tema escuro, claro ou automático do sistema"
          trailing={
            <View className="flex-row items-center gap-2">
              <Pill label={themeLabel} tone="neutral" />
              {chevron}
            </View>
          }
          onPress={() => onNavigate('appearance')}
        />

        <ListRow
          leading={
            <IconTile>
              <Bell size={19} color={colors.accent} strokeWidth={2} />
            </IconTile>
          }
          title="Lembretes e Alertas"
          subtitle="Avisos no celular sobre contas prestes a vencer"
          trailing={chevron}
          onPress={() => onNavigate('reminders')}
        />
      </ListSection>

      {/* Seção 2: Conexões financeiras */}
      <ListSection title="Financeiro">
        <ListRow
          leading={
            <IconTile>
              <Landmark size={19} color={colors.accent} strokeWidth={2} />
            </IconTile>
          }
          title="Contas e Cartões"
          subtitle="Gerencie seus bancos, carteira física e limites de crédito"
          trailing={
            <View className="flex-row items-center gap-2">
              {accountsCount > 0 && <Pill label={`${accountsCount} ativas`} tone="neutral" />}
              {chevron}
            </View>
          }
          onPress={() => onNavigate('accounts')}
        />

        <ListRow
          leading={
            <IconTile>
              <Tags size={19} color={colors.accent} strokeWidth={2} />
            </IconTile>
          }
          title="Categorias"
          subtitle="Gastos e entradas, por grupo"
          trailing={chevron}
          onPress={() => router.push('/categorias')}
        />
      </ListSection>

      {/* Seção 3: Armazenamento e Informações */}
      <ListSection title="Armazenamento e Ajuda">
        <ListRow
          leading={
            <IconTile>
              <HardDrive size={19} color={colors.accent} strokeWidth={2} />
            </IconTile>
          }
          title="Backup e Dados"
          subtitle="Exporte para o Google Drive ou restaure lançamentos"
          trailing={chevron}
          onPress={() => onNavigate('backup')}
        />

        <ListRow
          leading={
            <IconTile>
              <Info size={19} color={colors.accent} strokeWidth={2} />
            </IconTile>
          }
          title="Sobre o aplicativo"
          subtitle="Versão 2.0 · Armazenamento local e privacidade"
          trailing={chevron}
          onPress={() => onNavigate('about')}
        />
      </ListSection>
    </Screen>
  );
}

/** Sub-página: Aparência */
function AppearanceSection({ onBack }: { onBack: () => void }) {
  const [theme, setTheme] = useThemePreference();
  return (
    <Screen back={onBack} title="Aparência">
      <Surface tone="plain" className="gap-2 p-4">
        <Text variant="heading">Tema da interface</Text>
        <Text variant="muted">
          Escolha o esquema de cores que melhor se adapta à iluminação do seu ambiente.
        </Text>
      </Surface>

      <View className="gap-3 pt-2">
        <Segmented options={THEME_OPTIONS} value={theme} onChange={setTheme} />
      </View>
    </Screen>
  );
}

/** Sub-página: Contas e Cartões */
function AccountsSection({ onBack }: { onBack: () => void }) {
  const colors = useThemeColors();
  const balances = useBalances();

  const openAccount = (id: number | 'nova') =>
    router.push({ pathname: '/ajustes/conta/[id]', params: { id: String(id) } });

  return (
    <Screen
      back={onBack}
      title="Contas e Cartões"
      actions={
        <Button size="sm" variant="secondary" className="rounded-full px-3" onPress={() => openAccount('nova')}>
          <Plus size={16} color={colors.foreground} strokeWidth={2} />
          <Text className="text-xs">Nova conta</Text>
        </Button>
      }>
      <ListSection title="Suas contas ativas">
        {(balances.data ?? []).map((a) => {
          const Icon = ACCOUNT_ICON[a.type] ?? Landmark;
          return (
            <ListRow
              key={a.id}
              onPress={() => openAccount(a.id)}
              leading={
                <IconTile>
                  <Icon size={18} color={a.color} strokeWidth={1.9} />
                </IconTile>
              }
              title={a.name}
              subtitle={ACCOUNT_TYPE_LABEL[a.type]}
              trailing={<Money cents={a.balanceCents} tone={a.balanceCents < 0 ? 'expense' : 'default'} />}
            />
          );
        })}
      </ListSection>

      <Button size="lg" variant="secondary" onPress={() => openAccount('nova')}>
        <Plus size={18} color={colors.foreground} strokeWidth={2} />
        <Text>Adicionar nova conta ou cartão</Text>
      </Button>
    </Screen>
  );
}

/** Sub-página: Lembretes */
function RemindersSection({ onBack }: { onBack: () => void }) {
  const colors = useThemeColors();
  const syncReminders = useReminderSync();
  const [synced, setSynced] = useState(false);

  const handleSync = () => {
    syncReminders();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSynced(true);
    setTimeout(() => setSynced(false), 3000);
  };

  return (
    <Screen back={onBack} title="Lembretes">
      <Surface tone="raised" className="gap-2 p-5">
        <Text variant="heading">Sincronização de Alertas</Text>
        <Text variant="muted">
          O Rumo envia lembretes para o calendário e notificações do seu Android quando uma conta estiver perto de vencer.
        </Text>
      </Surface>

      <ListSection title="Ações">
        <ListRow
          leading={
            <IconTile>
              {synced ? (
                <CircleCheck size={18} color={colors.income} strokeWidth={2} />
              ) : (
                <RefreshCw size={18} color={colors.accent} strokeWidth={2} />
              )}
            </IconTile>
          }
          title={synced ? 'Lembretes atualizados!' : 'Sincronizar lembretes agora'}
          subtitle="Atualiza os alertas de todas as contas pendentes no calendário do celular"
          onPress={handleSync}
        />
      </ListSection>
    </Screen>
  );
}

/** Sub-página: Backup e Armazenamento */
function BackupSection({ onBack }: { onBack: () => void }) {
  const colors = useThemeColors();
  const exportBackup = useExportBackup();
  const importBackup = useImportBackup();

  const confirmImport = () =>
    Alert.alert(
      'Restaurar backup',
      'Tudo o que está no app agora será substituído pelo conteúdo do arquivo escolhido.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Escolher arquivo',
          style: 'destructive',
          onPress: () =>
            importBackup.mutate(undefined, {
              onSuccess: (r) => {
                if (r.imported) Alert.alert('Backup restaurado', `${r.transactions} lançamentos recuperados.`);
              },
            }),
        },
      ],
    );

  const backupError = exportBackup.error ?? importBackup.error;

  return (
    <Screen back={onBack} title="Backup e Dados">
      <Surface tone="plain" className="gap-2 p-4">
        <Text variant="heading">Como proteger seus dados</Text>
        <Text variant="muted">
          Seus dados ficam exclusivamente na memória deste celular. Exporte um backup de tempos em tempos para guardar no Google Drive ou enviar pelo WhatsApp.
        </Text>
      </Surface>

      <ListSection title="Ações de segurança">
        <ListRow
          onPress={() => exportBackup.mutate(undefined)}
          leading={
            <IconTile>
              <Upload size={18} color={colors.accent} strokeWidth={1.9} />
            </IconTile>
          }
          title="Exportar backup"
          subtitle="Gera um arquivo .json seguro para você salvar onde quiser"
        />
        <ListRow
          onPress={confirmImport}
          leading={
            <IconTile>
              <Download size={18} color={colors.accent} strokeWidth={1.9} />
            </IconTile>
          }
          title="Restaurar backup"
          subtitle="Recupera seus lançamentos e contas a partir de um arquivo anterior"
        />
      </ListSection>

      <ErrorNote message={backupError ? errorMessage(backupError) : null} />
    </Screen>
  );
}

/** Sub-página: Sobre o Rumo */
function AboutSection({ onBack }: { onBack: () => void }) {
  return (
    <Screen back={onBack} title="Sobre o Rumo">
      <View className="items-center gap-3 py-6">
        <Illustration name="plan" size={120} />
        <Text className="font-sans-semibold text-2xl text-foreground">Rumo Finanças</Text>
        <Pill label="Versão 2.0 (Build 2026)" tone="neutral" />
      </View>

      <Surface tone="plain" className="gap-3 p-5">
        <Text variant="heading">Privacidade em primeiro lugar</Text>
        <Text variant="muted">
          O Rumo é 100% offline e local por design. Suas contas, lançamentos e valores nunca trafegam por servidores externos.
        </Text>
        <Text variant="muted">
          Base visual inspirada no design system Brankas, com tipografia Plus Jakarta Sans e números monoespaçados em Geist Mono.
        </Text>
      </Surface>
    </Screen>
  );
}
