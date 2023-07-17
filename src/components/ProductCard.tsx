import { Text, Group, Image, Button, Card, Stack } from "@mantine/core";
import { Product } from "../utils/types";

interface ProductCardProps {
  product: Product;
  isAddingToCart: boolean;
  onClickAddToCart: (product: Product) => void;
}

function ProductCard(props: ProductCardProps) {
  const { product, isAddingToCart, onClickAddToCart } = props;
  const hasSale = Boolean(product.price.sale?.value);
  const hasSavingsMessage = Boolean(product.price.savings?.message);

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Image src={product.image} height={300} alt={product.name} mb="md" />
      <Text weight={500}>{product.name}</Text>

      <Stack spacing={0}>
        <Group position="right">
          {hasSavingsMessage && (
            <Text size="sm" color="red">
              {product.price.savings?.message}
            </Text>
          )}
        </Group>
        <Group position="right" spacing="xs">
          {hasSale ? (
            <>
              <Text size="sm" color="dimmed" strikethrough>
                {product.price.list?.formatted}
              </Text>
              <Text size="sm" weight="bold">
                {product.price.sale?.formatted}
              </Text>
            </>
          ) : (
            <Text size="sm" weight="bold">
              {product.price.list.formatted}
            </Text>
          )}
        </Group>
      </Stack>

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
