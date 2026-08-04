"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { initPostHog } from "@/lib/analytics";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

function getPersonProperties(user: User) {
  initPostHog();

  const name = user.user_metadata.full_name ?? user.user_metadata.name;

  return {
    ...(user.email ? { email: user.email } : {}),
    ...(typeof name === "string" ? { name } : {}),
  };
}

export const AuthProvider = ({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === "SIGNED_IN" && session?.user) {
        posthog.identify(session.user.id, getPersonProperties(session.user));
        setUser(session.user);
        setIsLoading(false);
      } else if (event === "TOKEN_REFRESHED") {
        setUser(session?.user ?? null);
        setIsLoading(false);
      } else if (event === "SIGNED_OUT") {
        posthog.reset();
        setUser(null);
        setIsLoading(false);
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  useEffect(() => {
    if (initialUser) {
      posthog.identify(initialUser.id, getPersonProperties(initialUser));
    }
  }, [initialUser]);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
