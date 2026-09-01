import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
import { Container } from "@/components/ui/Container";

export default function Loading() {
  return (
    <Container className="py-8">
      <SkeletonGrid count={8} />
    </Container>
  );
}
