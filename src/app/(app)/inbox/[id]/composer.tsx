"use client";

import { useRef } from "react";
import { sendMessage } from "@/app/actions/chat";
import { SendIcon } from "@/components/icons";
import { SubmitButton } from "@/components/ui";

export function Composer({ conversationId }: { conversationId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      action={async (fd) => {
        ref.current?.reset();
        await sendMessage(conversationId, fd);
      }}
      className="flex items-end gap-2"
    >
      <label htmlFor="msg" className="sr-only">Message</label>
      <textarea
        id="msg"
        name="body"
        rows={1}
        required
        maxLength={2000}
        placeholder="Write a message"
        className="input max-h-40 flex-1 resize-none !rounded-[22px]"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            ref.current?.requestSubmit();
          }
        }}
      />
      <SubmitButton className="btn btn-primary !size-11 !min-h-11 !rounded-full !p-0" aria-label="Send">
        <SendIcon />
      </SubmitButton>
    </form>
  );
}
