import { Text, Image, Button, Card } from "@mantine/core";
import { getFormattedPrice } from "../utils/misc";

interface CartProduct {
  id: string;
  name: string;
  image: string;
  price: number;
}

interface ProductCardProps {
  product: CartProduct;
  isAddingToCart: boolean;
  onClickAddToCart: (product: CartProduct) => void;
}

function ProductCard(props: ProductCardProps) {
  const { product, isAddingToCart, onClickAddToCart } = props;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Image src={product.image} height={300} alt={product.name} mb="md" />
      <Text weight={500}>{product.name}</Text>

      <Text size="sm" color="dimmed">
        {getFormattedPrice(product.price)}
      </Text>

      <Button
        variant="light"
        color="blue"
        fullWidth
        mt="md"
        radius="md"
        onClick={() => onClickAddToCart(product)}
      >
        {isAddingToCart ? "Adding To Cart..." : "Add To Cart"}
      </Button>
    </Card>
  );
}

export default ProductCard;
