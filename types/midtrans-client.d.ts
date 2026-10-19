declare module "midtrans-client" {
  export interface SnapOptions {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  export interface SnapTransactionDetail {
    order_id: string;
    gross_amount: number;
  }

  export type SnapCreateTransactionResponse = {
    token?: string;
    redirect_url?: string;
    error_messages?: string[];
  };

  export class Snap {
    constructor(options: SnapOptions);
    createTransaction(parameter: {
      transaction_details: SnapTransactionDetail;
      item_details?: unknown;
      customer_details?: unknown;
      credit_card?: unknown;
      [key: string]: unknown;
    }): Promise<SnapCreateTransactionResponse>;
  }

  const midtransClient: { Snap: typeof Snap };
  export default midtransClient;
}

interface Window {
  snap?: {
    pay(
      token: string,
      options?: {
        onSuccess?: (result: unknown) => void;
        onPending?: (result: unknown) => void;
        onError?: (result: unknown) => void;
        onClose?: () => void;
      },
    ): void;
  };
}
