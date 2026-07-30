import axios from "axios";

const OddoAxios = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_ODOO_BASE_URL}`,
  headers: {
    "Content-Type": "application/json",
    Authorization: "bearer " + `${process.env.NEXT_PUBLIC_ODOO_API_KEY}`,
    "X-Odoo-Database": `${process.env.NEXT_PUBLIC_ODOO_DB_NAME}`,
  },
});

export default OddoAxios;