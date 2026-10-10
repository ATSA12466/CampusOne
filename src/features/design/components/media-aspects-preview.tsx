import { CampusImage } from "@/components/media/campus-image";
import { images } from "@/config/images";
export function MediaAspectsPreview() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
      {(["square", "portrait", "tall", "video", "panorama"] as const).map((aspect) => (
        <div key={aspect}>
          <CampusImage
            image={images.campusLife}
            aspect={aspect}
            className="rounded-control"
            sizes="(max-width: 639px) 45vw, 20vw"
          />
          <p className="mt-2 text-xs font-semibold text-muted-foreground">
            {
              { square: "1:1", portrait: "4:5", tall: "3:4", video: "16:9", panorama: "21:9" }[
                aspect
              ]
            }{" "}
            / {aspect}
          </p>
        </div>
      ))}
    </div>
  );
}
