import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
import { Container } from "@/components/ui/Container";

export default function ServicesLoading() {
  return (
    <Container className="py-8">
      <SkeletonGrid count={6} />
    </Container>
  );
}
