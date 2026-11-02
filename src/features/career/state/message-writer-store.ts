import { create } from 'zustand';

interface MessageWriterState {
  isOpen: boolean;
  selectedTemplateId?: string;
  initialPrompt?: string;

  openModal: (options?: { templateId?: string; prompt?: string }) => void;
  closeModal: () => void;
}

export const useMessageWriterStore = create<MessageWriterState>((set) => ({
  isOpen: false,
  selectedTemplateId: undefined,
  initialPrompt: undefined,

  openModal: (options) =>
    set({
      isOpen: true,
      selectedTemplateId: options?.templateId,
      initialPrompt: options?.prompt,
    }),
  closeModal: () =>
    set({
      isOpen: false,
      selectedTemplateId: undefined,
      initialPrompt: undefined,
    }),
}));
