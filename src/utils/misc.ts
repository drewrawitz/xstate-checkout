export const wait = async (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function delay(
  ms: number,
  errorProbability: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < errorProbability) {
        reject();
      } else {
        resolve();
      }
    }, ms);
  });
}

export const getFormattedPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price / 100);
};
