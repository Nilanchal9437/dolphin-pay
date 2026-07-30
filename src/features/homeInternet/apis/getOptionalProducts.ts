import Axios from "@/src/libs/Axios";

export const getOptionalProducts = async (variantId: string) => {
  try {
    const response = await Axios.get(
      `/apis/get-optional-products?variantId=${variantId}`,
    ).then((res) => res.data);
    if (response) {
      return { status: true, data: response.data };
    }
    return { status: false, data: [] };
  } catch (error) {
    console.error("Error fetching optional products:", error);
    return { status: false, data: [] };
  }
};
