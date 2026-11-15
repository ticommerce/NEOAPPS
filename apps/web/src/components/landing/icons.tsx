import type { SVGProps } from "react";

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    />
  );
}

export const icons = {
  book: (p: SVGProps<SVGSVGElement>) => (
    <Icon {...p}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20" transform="translate(0 -2)" />
      <path d="M9 8h7M9 12h5" />
    </Icon>
  ),
  bag: (p: SVGProps<SVGSVGElement>) => (
    <Icon {...p}>
      <path d="M5 8h14l-1 12H6z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </Icon>
  ),
  calendar: (p: SVGProps<SVGSVGElement>) => (
    <Icon {...p}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17M9 15l2 2 4-4" />
    </Icon>
  ),
  handoff: (p: SVGProps<SVGSVGElement>) => (
    <Icon {...p}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c.6-3.4 3-5.5 6-5.5 1.2 0 2.300.3 3.200.9" />
      <path d="M15 17h6m-2.500-2.500L21 17l-2.500 2.500" />
    </Icon>
  ),
  channels: (p: SVGProps<SVGSVGElement>) => (
    <Icon {...p}>
      <path d="M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      <path d="M20 9.5a2 2 0 0 1 2 2V16a2 2 0 0 1-2 2v2.500L17 18h-4" />
    </Icon>
  ),
  inbox: (p: SVGProps<SVGSVGElement>) => (
    <Icon {...p}>
      <path d="M4 13 6.500 5h11L20 13v6H4z" />
      <path d="M4 13h4.500l1 2.500h5l1-2.500H20" />
    </Icon>
  ),
  check: (p: SVGProps<SVGSVGElement>) => (
    <Icon {...p}>
      <path d="m5 12.500 4.500 4.500L19 7.500" />
    </Icon>
  ),
  whatsapp: (p: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
      <path d="M12 2a10 10 0 0 0-8.600 15.100L2 22l5.100-1.300A10 10 0 1 0 12 2zm0 1.800a8.200 8.200 0 1 1-4.300 15.200l-.300-.200-3 .800.800-2.900-.200-.300A8.200 8.200 0 0 1 12 3.800zM8.500 7.200c-.200 0-.500.100-.700.400-.300.300-1 .900-1 2.300s1 2.700 1.100 2.900c.200.200 2 3.200 5 4.400 2.500 1 3 .800 3.500.700.500 0 1.700-.700 2-1.400.200-.700.200-1.200.100-1.400l-.500-.300-1.800-.900c-.300-.100-.500-.100-.700.200l-.800 1c-.100.200-.300.200-.600.100a6.700 6.700 0 0 1-3.300-2.900c-.200-.400.300-.400.700-1.300.100-.200 0-.400 0-.500l-.800-2c-.200-.500-.400-.400-.600-.400z" />
    </svg>
  ),
};

export type IconName = keyof typeof icons;
