"use client";

import { uiTheme } from "@/lib/design-system";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterOptions } from "@/pages/listen"; // Adjust the import path as necessary
import { motion } from "framer-motion";
import { ArrowUpDown, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";
import { Dispatch, SetStateAction } from "react";

interface SortOptionsProps {
  filterOptions: FilterOptions;
  setFilterOptions: Dispatch<SetStateAction<FilterOptions>>;
  setIsSortExpanded: Dispatch<SetStateAction<boolean>>;
}

export function SortOptions({
  filterOptions,
  setFilterOptions,
  setIsSortExpanded,
}: SortOptionsProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const theme = { ...uiTheme, accentBgMedium: "hsl(var(--primary) / .15)" };

  const sortOptions = [
    { value: "mostRecent", label: "Most Recent" },
    { value: "playCount", label: "Play Count" },
    { value: "likes", label: "Likes" },
    { value: "voteBestMusically", label: "Votes: Best Musically" },
    { value: "voteBestLyrically", label: "Votes: Best Lyrically" },
    { value: "voteBestOverall", label: "Votes: Best Overall" },
    { value: "firstBibleVerse", label: "Bible Verse (First in Song)" },
  ];

  const clearSort = () => {
    setFilterOptions((prev) => ({
      ...prev,
      sortBy: "mostRecent",
      sortOrder: "desc",
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2" style={{ backgroundColor: theme.accentBgLight }}>
            <ArrowUpDown className="h-5 w-5" style={{ color: theme.accent }} />
          </div>
          <div>
            <h2
              className="text-lg font-bold"
              style={{ color: theme.accent, fontFamily: "'Italiana', serif" }}
            >
              Sort Options
            </h2>
            <p
              className="text-sm"
              style={{
                color: theme.textSecondary,
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Organize songs by your preferred criteria
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearSort}
          className="flex items-center gap-2 backdrop-blur-sm transition-all duration-300"
          style={{
            backgroundColor: theme.hoverBg,
            borderColor: theme.border,
            color: theme.text,
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          <RefreshCw className="h-4 w-4" />
          Reset Sort
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SortSelect
          title="Sort By"
          value={filterOptions.sortBy}
          onChange={(value) =>
            setFilterOptions((prev) => ({ ...prev, sortBy: value }))
          }
          options={sortOptions}
          theme={theme}
        />
        <SortSelect
          title="Sort Order"
          value={filterOptions.sortOrder}
          onChange={(value) =>
            setFilterOptions((prev) => ({
              ...prev,
              sortOrder: value as "asc" | "desc",
            }))
          }
          options={[
            { value: "asc", label: "Ascending" },
            { value: "desc", label: "Descending" },
          ]}
          theme={theme}
        />
      </div>
    </motion.div>
  );
}

interface SortSelectProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  theme: {
    bg: string;
    bgCard: string;
    text: string;
    textSecondary: string;
    accent: string;
    accentHover: string;
    border: string;
    borderHover: string;
    hoverBg: string;
    accentBgLight: string;
    accentBgMedium: string;
  };
}

function SortSelect({
  title,
  value,
  onChange,
  options,
  theme,
}: SortSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={title}
        className="w-full backdrop-blur-sm transition-all duration-300 h-12"
        style={{
          backgroundColor: theme.hoverBg,
          borderColor: theme.border,
          color: theme.text,
          fontFamily: "'Manrope', sans-serif",
        }}
      >
        <SelectValue placeholder={title} />
      </SelectTrigger>
      <SelectContent
        className="backdrop-blur-xl"
        style={{
          backgroundColor: theme.bgCard,
          borderColor: theme.border,
        }}
      >
        <SelectGroup>
          <SelectLabel
            className="font-semibold"
            style={{ color: theme.accent, fontFamily: "'Italiana', serif" }}
          >
            {title}
          </SelectLabel>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="transition-all duration-200"
              style={{ color: theme.text, fontFamily: "'Manrope', sans-serif" }}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
