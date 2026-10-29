import ClassicTemplate from "./ClassicTemplate";
import MinimalTemplate from "./MinimalTemplate";
import FloralTemplate from "./FloralTemplate";
import RusticTemplate from "./RusticTemplate";
import BerkreativeTemplate from "./BerkreativeTemplate";
import GardenTemplate from "./GardenTemplate";
import BotanicalTemplate from "./BotanicalTemplate";
import ZenTemplate from "./ZenTemplate";
import VogueTemplate from "./VogueTemplate";
import CelestialTemplate from "./CelestialTemplate";
import ScrapbookTemplate from "./ScrapbookTemplate";
import EnchantedTemplate from "./EnchantedTemplate";
import FairytaleTemplate from "./FairytaleTemplate";
import OnyxTemplate from "./OnyxTemplate";
import WayangTemplate from "./WayangTemplate";
import SenjaTemplate from "./SenjaTemplate";
import RubyTemplate from "./RubyTemplate";
import PurpleTemplate from "./PurpleTemplate";
import WedflixTemplate from "./WedflixTemplate";
import SpotifyTemplate from "./SpotifyTemplate";
import RimbaZamrudTemplate from "./RimbaZamrudTemplate";
import DecorationLayer from "./DecorationLayer";
import type { TemplateProps } from "./types";

const registry: Record<string, React.ComponentType<TemplateProps>> = {
  classic: ClassicTemplate,
  minimal: MinimalTemplate,
  floral: FloralTemplate,
  rustic: RusticTemplate,
  berkreative: BerkreativeTemplate,
  garden: GardenTemplate,
  botanical: BotanicalTemplate,
  zen: ZenTemplate,
  vogue: VogueTemplate,
  celestial: CelestialTemplate,
  scrapbook: ScrapbookTemplate,
  enchanted: EnchantedTemplate,
  fairytale: FairytaleTemplate,
  onyx: OnyxTemplate,
  wayang: WayangTemplate,
  senja: SenjaTemplate,
  ruby: RubyTemplate,
  purple: PurpleTemplate,
  wedflix: WedflixTemplate,
  spotify: SpotifyTemplate,
  "rimba-zamrud": RimbaZamrudTemplate,
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
