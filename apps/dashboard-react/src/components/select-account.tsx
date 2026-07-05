type SelectedItem = {
  id: string;
  label: string;
  logo: string | null;
  currency: string | null;
  type?: string | null;
};

type Props = {
  placeholder: string;
  className?: string;
  value?: string;
  onChange: (value: SelectedItem) => void;
  popoverProps?: unknown;
  modal?: boolean;
};

export function SelectAccount(_props: Props) {
  return null;
}
