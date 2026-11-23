import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useImperativeHandle, useRef, type ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from './text';
import { space, useThemeColors } from './theme';

/** Scrollable content for a Sheet (use when the content exceeds the snap point). */
export { BottomSheetScrollView as SheetScrollView } from '@gorhom/bottom-sheet';
/** Text input that stays visible above the keyboard inside a Sheet. */
export { BottomSheetTextInput as SheetTextInput } from '@gorhom/bottom-sheet';

const SHEET_RADIUS = 36;
const DEFAULT_SNAP_POINTS = ['50%'];

export type SheetRef = {
  present: () => void;
  dismiss: () => void;
};

export type SheetProps = {
  /** Only used when enableDynamicSizing is false. Defaults to ['50%']. */
  snapPoints?: BottomSheetModalProps['snapPoints'];
  /** Sheet height follows its content. Default: true. */
  enableDynamicSizing?: boolean;
  title?: string;
  children?: ReactNode;
};

/**
 * Rumo bottom sheet on top of @gorhom/bottom-sheet's BottomSheetModal.
 * Open/close imperatively: `ref.current?.present()` / `ref.current?.dismiss()`.
 * Requires BottomSheetModalProvider (mounted in src/app/_layout.tsx).
 */
export const Sheet = forwardRef<SheetRef, SheetProps>(function Sheet(
  { snapPoints, enableDynamicSizing = true, title, children },
  ref,
) {
  const modalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  useImperativeHandle(
    ref,
    () => ({
      present: () => modalRef.current?.present(),
      dismiss: () => modalRef.current?.dismiss(),
    }),
    [],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.6}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={modalRef}
      enableDynamicSizing={enableDynamicSizing}
      snapPoints={enableDynamicSizing ? undefined : (snapPoints ?? DEFAULT_SNAP_POINTS)}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: colors.card,
        borderTopLeftRadius: SHEET_RADIUS,
        borderTopRightRadius: SHEET_RADIUS,
      }}
      handleIndicatorStyle={{ backgroundColor: colors.mutedForeground, opacity: 0.4 }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore">
      <BottomSheetView
        style={{
          paddingHorizontal: space.gutter,
          paddingTop: space.sm,
          paddingBottom: insets.bottom + space.lg,
        }}>
        {title ? <Text variant="heading" style={{ marginBottom: space.md }}>{title}</Text> : null}
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
});
