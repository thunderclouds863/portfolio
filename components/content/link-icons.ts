import {
  BriefcaseBusinessIcon,
  FolderGit2Icon,
  GlobeIcon,
  MailIcon,
  MessageCircleIcon,
} from "lucide-react";

/** Icon per profile link type (lucide-react has no brand icons). Shared by Contact and Footer. */
export const linkIcons = {
  email: MailIcon,
  linkedin: BriefcaseBusinessIcon,
  github: FolderGit2Icon,
  whatsapp: MessageCircleIcon,
  website: GlobeIcon,
} as const;

export { GlobeIcon as FallbackLinkIcon };
