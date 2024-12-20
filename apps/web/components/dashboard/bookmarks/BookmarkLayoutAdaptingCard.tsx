import type { BookmarksLayoutTypes } from "@/lib/userLocalSettings/types";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useBulkActionsStore from "@/lib/bulkActions";
import {
  bookmarkLayoutSwitch,
  useBookmarkLayout,
} from "@/lib/userLocalSettings/bookmarksLayout";
import { ArchivedActionIcon, FavouritedActionIcon } from "./icons";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { Check, Image as ImageIcon, NotebookPen } from "lucide-react";
import { useUpdateBookmark } from "@hoarder/shared-react/hooks/bookmarks";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";

import type { ZBookmark } from "@hoarder/shared/types/bookmarks";
import { isBookmarkStillTagging } from "@hoarder/shared-react/utils/bookmarkUtils";
import { BookmarkTypes } from "@hoarder/shared/types/bookmarks";

import BookmarkActionBar from "./BookmarkActionBar";
import TagList from "./TagList";

interface Props {
  bookmark: ZBookmark;
  image: (layout: BookmarksLayoutTypes, className: string) => React.ReactNode;
  title?: React.ReactNode;
  content?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  fitHeight?: boolean;
  wrapTags: boolean;
}

function BottomRow({
  footer,
  bookmark,
}: {
  footer?: React.ReactNode;
  bookmark: ZBookmark;
}) {
  return (
    <div className="justify flex w-full shrink-0 justify-between text-gray-500">
      <div className="flex items-center gap-2 overflow-hidden text-nowrap">
        {footer && <>{footer}•</>}
        <Link
          href={`/dashboard/preview/${bookmark.id}`}
          suppressHydrationWarning
        >
          {dayjs(bookmark.createdAt).format("MMM DD")}
        </Link>
      </div>
      <BookmarkActionBar bookmark={bookmark} />
    </div>
  );
}

function MultiBookmarkSelector({ bookmark }: { bookmark: ZBookmark }) {
  const { toast } = useToast();
  const { selectedBookmarks, isBulkEditEnabled, setIsBulkEditEnabled } = useBulkActionsStore();
  const updateBookmarkMutator = useUpdateBookmark({
    onSuccess: () => {
      toast({
        description: "Bookmark updated successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Something went wrong",
      });
    },
  });
  const toggleBookmark = useBulkActionsStore((state) => state.toggleBookmark);
  const [isSelected, setIsSelected] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setIsSelected(selectedBookmarks.some((item) => item.id === bookmark.id));
  }, [selectedBookmarks]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isBulkEditEnabled) {
      setIsBulkEditEnabled(true);
    }
    toggleBookmark(bookmark);
  };

  const getIconColor = () => {
    if (theme === "dark") {
      return isSelected ? "black" : "white";
    }
    return isSelected ? "white" : "black";
  };

  const getIconBackgroundColor = () => {
    if (theme === "dark") {
      return isSelected ? "bg-white" : "bg-white bg-opacity-10";
    }
    return isSelected ? "bg-black" : "bg-white bg-opacity-40";
  };

  return (
    <>
      {isBulkEditEnabled && (
        <button
          className={cn(
            "absolute left-0 top-0 z-40 h-full w-full bg-opacity-0",
            {
              "bg-opacity-10": isSelected,
            },
            theme === "dark" ? "bg-white" : "bg-black",
          )}
          onClick={handleClick}
        />
      )}
      <div className={cn(
        "absolute right-2 top-2 z-50 flex items-center gap-2 group-hover:visible rounded-lg px-2 py-1",
        isSelected ? "visible" : "invisible",
        theme === "dark" ? "bg-black/50 backdrop-blur-sm" : "bg-white/50 backdrop-blur-sm"
      )}>
        <button
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent",
          )}
          onClick={() =>
            updateBookmarkMutator.mutate({
              bookmarkId: bookmark.id,
              favourited: !bookmark.favourited,
            })
          }
        >
          <FavouritedActionIcon
            className="size-4"
            favourited={bookmark.favourited}
          />
        </button>
        <button
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent",
          )}
          onClick={() =>
            updateBookmarkMutator.mutate({
              bookmarkId: bookmark.id,
              archived: !bookmark.archived,
            })
          }
        >
          <ArchivedActionIcon
            className="size-4"
            archived={bookmark.archived}
          />
        </button>
        <button
          onClick={handleClick}
        >
          <div
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded-full border border-gray-600",
              getIconBackgroundColor(),
            )}
          >
            <Check size={12} color={getIconColor()} />
          </div>
        </button>
      </div>
    </>
  );
}

function ListView({
  bookmark,
  image,
  title,
  content,
  footer,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "group relative flex max-h-96 gap-4 overflow-hidden rounded-lg p-2 shadow-md",
        className,
      )}
    >
      <MultiBookmarkSelector bookmark={bookmark} />
      <div className="flex size-32 items-center justify-center overflow-hidden">
        {image("list", "object-cover rounded-lg size-32")}
      </div>
      <div className="flex h-full flex-1 flex-col justify-between gap-2 overflow-hidden">
        <div className="flex flex-col gap-2 overflow-hidden">
          {title && (
            <div className="line-clamp-2 flex-none shrink-0 overflow-hidden text-ellipsis break-words text-lg">
              {title}
            </div>
          )}
          {content && <div className="shrink-1 overflow-hidden">{content}</div>}
          <div className="flex shrink-0 flex-wrap gap-1 overflow-hidden">
            <TagList
              bookmark={bookmark}
              loading={isBookmarkStillTagging(bookmark)}
            />
          </div>
        </div>
        <BottomRow footer={footer} bookmark={bookmark} />
      </div>
    </div>
  );
}

function GridView({
  bookmark,
  image,
  title,
  content,
  footer,
  className,
  wrapTags,
  layout,
  fitHeight = false,
}: Props & { layout: BookmarksLayoutTypes }) {
  const img = image("grid", "h-56 min-h-56 w-full object-cover rounded-t-lg");

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg shadow-md",
        className,
        fitHeight && layout != "grid" ? "max-h-96" : "h-96",
      )}
    >
      <MultiBookmarkSelector bookmark={bookmark} />
      {img && <div className="h-56 w-full shrink-0 overflow-hidden">{img}</div>}
      <div className="flex h-full flex-col justify-between gap-2 overflow-hidden p-2">
        <div className="grow-1 flex flex-col gap-2 overflow-hidden">
          {title && (
            <div className="line-clamp-2 flex-none shrink-0 overflow-hidden text-ellipsis break-words text-lg">
              {title}
            </div>
          )}
          {content && <div className="shrink-1 overflow-hidden">{content}</div>}
          <div className="flex shrink-0 flex-wrap gap-1 overflow-hidden">
            <TagList
              className={wrapTags ? undefined : "h-full"}
              bookmark={bookmark}
              loading={isBookmarkStillTagging(bookmark)}
            />
          </div>
        </div>
        <BottomRow footer={footer} bookmark={bookmark} />
      </div>
    </div>
  );
}

function CompactView({ bookmark, title, footer, className }: Props) {
  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg shadow-md",
        className,
        "max-h-96",
      )}
    >
      <MultiBookmarkSelector bookmark={bookmark} />
      <div className="flex h-full justify-between gap-2 overflow-hidden p-2">
        <div className="flex items-center gap-2">
          {bookmark.content.type === BookmarkTypes.LINK &&
            bookmark.content.favicon && (
              <Image
                src={bookmark.content.favicon}
                alt="favicon"
                width={5}
                unoptimized
                height={5}
                className="size-5"
              />
            )}
          {bookmark.content.type === BookmarkTypes.TEXT && (
            <NotebookPen className="size-5" />
          )}
          {bookmark.content.type === BookmarkTypes.ASSET && (
            <ImageIcon className="size-5" />
          )}
          {
            <div className="shrink-1 text-md line-clamp-1 overflow-hidden text-ellipsis break-words">
              {title ?? "Untitled"}
            </div>
          }
          {footer && (
            <p className="flex shrink-0 gap-2 text-gray-500">•{footer}</p>
          )}
          <p className="text-gray-500">•</p>
          <Link
            href={`/dashboard/preview/${bookmark.id}`}
            suppressHydrationWarning
            className="shrink-0 gap-2 text-gray-500"
          >
            {dayjs(bookmark.createdAt).format("MMM DD")}
          </Link>
        </div>
        <BookmarkActionBar bookmark={bookmark} />
      </div>
    </div>
  );
}

export function BookmarkLayoutAdaptingCard(props: Props) {
  const layout = useBookmarkLayout();

  return bookmarkLayoutSwitch(layout, {
    masonry: <GridView layout={layout} {...props} />,
    grid: <GridView layout={layout} {...props} />,
    list: <ListView {...props} />,
    compact: <CompactView {...props} />,
  });
}
