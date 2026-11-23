/**
 * Tells the app which notifications of which app are a payment received.
 * `titlePattern` (optional) and `textPattern` are case-insensitive regexes. The text pattern must have
 * a group for the amount: named `valor`, or group 1. A group named `pagador`, or group 2, gives the payer.
 */
export type NotificationRule = {
  id: number;
  name: string;
  packageName: string;
  titlePattern: string | null;
  textPattern: string;
  active: boolean;
};

export type NotificationRuleContent = Omit<NotificationRule, 'id' | 'active'>;
