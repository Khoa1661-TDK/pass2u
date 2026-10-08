// Icons come from Phosphor (SSR build so they work in server components).
import type { ComponentProps, ComponentType } from "react";
import * as P from "@phosphor-icons/react/dist/ssr";

type IconProps = ComponentProps<typeof P.Plus>;
const icon = (I: ComponentType<IconProps>, weight: IconProps["weight"] = "regular") => {
  const C = (p: IconProps) => <I size={20} weight={weight} aria-hidden {...p} />;
  return C;
};

export const SearchIcon = icon(P.MagnifyingGlass);
export const PlusIcon = icon(P.Plus, "bold");
export const ChatIcon = icon(P.ChatCircle);
export const GridIcon = icon(P.SquaresFour);
export const UserIcon = icon(P.User);
export const CheckBadge = icon(P.SealCheck, "fill");
export const ShieldIcon = icon(P.ShieldCheck);
export const ArrowLeft = icon(P.CaretLeft);
export const CameraIcon = icon(P.Camera);
export const XIcon = icon(P.X, "bold");
export const SendIcon = icon(P.PaperPlaneRight, "fill");
