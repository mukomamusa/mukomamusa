// app/types/flutterwave-node-v3.d.ts

declare module 'flutterwave-node-v3' {
  export interface FlutterwaveResponse {
    status: string;
    message: string;
    data?: {
      flw_ref?: string;
      payment_link?: string;
      transaction_id?: string;
      [key: string]: any;
    };
  }

  export interface MobileMoneyPayload {
    tx_ref: string;
    amount: number;
    currency: string;
    phone_number: string;
    email: string;
    fullname: string;
    network: string;
    redirect_url?: string;
  }

  export interface CardPayload {
    tx_ref: string;
    amount: number;
    currency: string;
    redirect_url: string;
    payment_options?: string;
    customer: {
      email: string;
      phonenumber?: string;
      name: string;
    };
    customizations: {
      title: string;
      description: string;
      logo: string;
    };
  }

  export interface BankTransferPayload {
    tx_ref: string;
    amount: number;
    currency: string;
    redirect_url: string;
    customer: {
      email: string;
      name: string;
    };
    customizations?: {
      title: string;
      description: string;
      logo: string;
    };
  }

  export class Flutterwave {
    constructor(publicKey: string, secretKey: string);
    
    MobileMoney: {
      zambia(payload: MobileMoneyPayload): Promise<FlutterwaveResponse>;
    };
    
    Card: {
      charge(payload: CardPayload): Promise<FlutterwaveResponse>;
    };
    
    Bank: {
      transfer(payload: BankTransferPayload): Promise<FlutterwaveResponse>;
    };
    
    Charge: {
      card(payload: CardPayload): Promise<FlutterwaveResponse>;
      mobile_money_zambia(payload: MobileMoneyPayload): Promise<FlutterwaveResponse>;
    };
  }

  export default Flutterwave;
}