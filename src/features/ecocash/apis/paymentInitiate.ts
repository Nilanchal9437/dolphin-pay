import Axios from "@/src/libs/Axios";

export type EcocashPaymentResponse = {
  success: boolean;
  transaction_id: string;
  payment_method: string;
  status: "processing" | "success" | "failed"; // you can extend if needed
  amount: number;
  currency: string;
  poll_url: string;
  message: string;
};

export const ecocashPaymentInitiate = async ({
  amount,
  customer_name,
  account_number,
  phone,
  param,
}: {
  customer_name: string;
  account_number: string;
  phone: string;
  amount: number;
  param: string;
}): Promise<{ status: boolean; data: EcocashPaymentResponse | null }> => {
  try {
    const response = await Axios.post(`/apis/payment/ecocash?${param}`, {
      amount,
      customer_name,
      account_number,
      phone,
    }).then((res) => res.data);

    if (response) {
      return { status: true, data: response };
    } else {
      return { status: false, data: null };
    }
  } catch (error) {
    console.error("Error ecocash payment initiate:", error);
    return { status: false, data: null };
  }
};
