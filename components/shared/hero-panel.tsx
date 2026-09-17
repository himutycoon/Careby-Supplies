import { EditorialImage } from "@/components/shared/editorial-image";
import { ImageSlideshow } from "@/components/shared/image-slideshow";
import {
  siteImage,
  siteImageAlt,
  slideshow,
  type SiteImageSlot,
  type SlideshowSlot,
} from "@/data/site-images";
import { cn } from "@/lib/utils";

/**
 * The large image panel used by the home hero and premium section.
 *
 * Degrades in three steps so no configuration state looks broken:
 *   2+ slides  -> crossfading slideshow
 *   1 image    -> still photo
 *   none       -> the designed tone placeholder
 */
export function HeroPanel({
  slideshowSlot,
  imageSlot,
  tone = "slate",
  className,
}: {
  slideshowSlot: SlideshowSlot;
  imageSlot?: SiteImageSlot;
  tone?: "sand" | "slate" | "forest" | "navy";
  className?: string;
}) {
  const slides = slideshow(slideshowSlot);

  if (slides.length > 0) {
    return (
      <ImageSlideshow
        slides={slides}
        className={cn("rounded-xl", className)}
      />
    );
  }

  return (
    <EditorialImage
      tone={tone}
      src={imageSlot ? siteImage(imageSlot) : undefined}
      alt={imageSlot ? siteImageAlt(imageSlot) : ""}
      className={className}
    />
  );
}
