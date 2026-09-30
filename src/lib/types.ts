export type Source = {
  id: string;
  platform_id: string;
  current_handle: string | null;
  display_name: string;
  avatar_url: string | null;
  verification_status: "UNCLAIMED" | "VERIFIED" | "SUSPENDED";
};

export type Content = {
  id: string;
  source_id: string;
  title: string;
  thumbnail_url: string | null;
  canonical_url: string;
};

export type Pledge = {
  id: string;
  source_id: string;
  source_content_id: string | null;
  supporter_email: string | null;
  amount: number;
  status: string;
  expires_at: string;
};

export type Claim = {
  id: string;
  source_id: string;
  status: "STARTED" | "PLATFORM_VERIFIED" | "ACTIVE" | "FAILED";
  expires_at: string;
};
