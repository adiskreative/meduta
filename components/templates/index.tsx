import ClassicTemplate from "./ClassicTemplate";
import MinimalTemplate from "./MinimalTemplate";
import FloralTemplate from "./FloralTemplate";
import DecorationLayer from "./DecorationLayer";
import type { TemplateProps } from "./types";

const registry: Record<string, React.ComponentType<TemplateProps>> = {
  classic: ClassicTemplate,
  minimal: MinimalTemplate,
  floral: FloralTemplate,
};

export default function TemplateRenderer({
  componentKey,
  decorations,
  ...props
}: TemplateProps & { componentKey: string }) {
  const Component = registry[componentKey] ?? ClassicTemplate;
  return (
    <>
      <Component {...props} decorations={decorations} />
      <DecorationLayer decorations={decorations} />
    </>
  );
}
