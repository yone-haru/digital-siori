import Image from "next/image";
import { bookColor } from "@/lib/utils";

type Props = {
  title: string;
  coverUrl?: string | null;
  width?: number;
  height?: number;
  className?: string;
};

export function BookCover({
  title,
  coverUrl,
  width = 104,
  height = 152,
  className = "",
}: Props) {
  const bg = bookColor(title);
  const fontSize = Math.max(8, Math.round(width * 0.11));

  return (
    <div
      className={`relative rounded-[1px] overflow-hidden shadow-[1px_2px_8px_rgba(0,0,0,0.18)] shrink-0 ${className}`}
      style={{ width, height }}
    >
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={title}
          fill
          className="object-cover"
          sizes={`${width}px`}
        />
      ) : (
        <div
          className="w-full h-full flex flex-col justify-between p-2"
          style={{ backgroundColor: bg }}
        >
          <div className="w-full h-px bg-white opacity-20" />
          <p
            className="font-shippori text-white opacity-60 break-all leading-[1.4]"
            style={{ fontSize }}
          >
            {title.slice(0, 10)}
          </p>
        </div>
      )}
    </div>
  );
}
