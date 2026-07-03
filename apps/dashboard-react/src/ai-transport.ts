type TransportOptions = {
  api: string;
  headers?: Record<string, string> | (() => Promise<Record<string, string>>);
  body?: Record<string, unknown> | (() => Record<string, unknown>);
};

export class DefaultChatTransport {
  private options: TransportOptions;

  constructor(options: TransportOptions) {
    this.options = options;
  }

  getOptions() {
    return this.options;
  }
}
