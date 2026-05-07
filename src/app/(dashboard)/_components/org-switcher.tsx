"use client";
import { useState, useTransition } from "react";
import { Check, ChevronsUpDown, Building2, User as UserIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { setActiveContext } from "@/app/actions/context";

type OrgSwitcherProps = {
  userLogin: string;
  orgs: Array<{ login: string; avatar_url: string }>;
  activeLogin: string;
};

export function OrgSwitcher({ userLogin, orgs, activeLogin }: OrgSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function selectLogin(login: string) {
    setOpen(false);
    startTransition(() => {
      void setActiveContext(login);
    });
  }

  const isUserActive = activeLogin === userLogin;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-expanded={open}
          disabled={pending}
          className="w-[180px] justify-between sm:w-[220px]"
        >
          <span className="flex items-center gap-2 truncate">
            {isUserActive ? (
              <UserIcon className="size-4" />
            ) : (
              <Building2 className="size-4" />
            )}
            <span className="truncate">{activeLogin}</span>
          </span>
          <ChevronsUpDown className="ml-2 size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search account or org..." />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading="Personal">
              <CommandItem
                value={userLogin}
                onSelect={() => selectLogin(userLogin)}
              >
                <UserIcon className="size-4" />
                <span className="truncate">{userLogin}</span>
                <Check
                  className={cn(
                    "ml-auto size-4",
                    isUserActive ? "opacity-100" : "opacity-0",
                  )}
                />
              </CommandItem>
            </CommandGroup>
            {orgs.length > 0 ? (
              <CommandGroup heading="Organizations">
                {orgs.map((org) => (
                  <CommandItem
                    key={org.login}
                    value={org.login}
                    onSelect={() => selectLogin(org.login)}
                  >
                    <Building2 className="size-4" />
                    <span className="truncate">{org.login}</span>
                    <Check
                      className={cn(
                        "ml-auto size-4",
                        activeLogin === org.login
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
