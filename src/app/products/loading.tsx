import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
import { Container } from "@/components/ui/Container";

export default function ProductsLoading() {
  return (
    <Container className="py-8">
      <SkeletonGrid count={8} />
    </Container>
  );
}
