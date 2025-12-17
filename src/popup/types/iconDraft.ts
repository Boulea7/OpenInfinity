export type IconDraft =
  | {
      type: 'text';
      value: string;
      color: string;
      dataUrl?: string;
    }
  | {
      type: 'favicon' | 'custom';
      value: string;
    };

export type EditRequest = {
  imageUrl: string;
  iconType: 'favicon' | 'custom';
};

