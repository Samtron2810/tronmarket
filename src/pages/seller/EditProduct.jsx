import { useParams } from "react-router-dom";
import ProductForm from "./ProductForm";

export default function EditProduct() {
  const { id } = useParams();
  return <ProductForm mode="edit" productId={id} />;
}
