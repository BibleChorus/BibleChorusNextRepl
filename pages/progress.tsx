"use client";

import { uiTheme } from "@/lib/design-system";

import { FilterOptions, Filters } from "@/components/ProgressPage/Filters";
import { PieChartGroup } from "@/components/ProgressPage/PieChartGroup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { BIBLE_BOOKS } from "@/lib/constants";
import { motion } from "framer-motion";
import { BookOpen, Filter, TrendingUp, X } from "lucide-react";
import { useTheme } from "next-themes";
import Head from "next/head";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartData {
  "Old Testament": {
    books: Array<{
      book: string;
      verses_covered: number;
      filtered_verses_covered: number;
      total_verses: number;
      book_percentage: number;
      filtered_book_percentage: number;
    }>;
    testament_percentage: number;
    testament_verses_covered: number;
    testament_total_verses: number;
    filtered_testament_percentage: number;
    filtered_testament_verses_covered: number;
  };
  "New Testament": {
    books: Array<{
      book: string;
      verses_covered: number;
      filtered_verses_covered: number;
      total_verses: number;
      book_percentage: number;
      filtered_book_percentage: number;
    }>;
    testament_percentage: number;
    testament_verses_covered: number;
    testament_total_verses: number;
    filtered_testament_percentage: number;
    filtered_testament_verses_covered: number;
  };
  bibleTotal: {
    bible_percentage: number;
    bible_verses_covered: number;
    bible_total_verses: number;
    filtered_bible_percentage: number;
    filtered_bible_verses_covered: number;
  };
}

export default function Progress() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const theme = { ...uiTheme, separator: "hsl(var(--border))" };

  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    lyricsAdherence: [],
    isContinuous: "all",
    aiMusic: "all",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError(false);
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/progress?${new URLSearchParams(filterOptions as any)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Could not load coverage");
        const data = await response.json();
        if (
          !data.bibleTotal ||
          !data["Old Testament"] ||
          !data["New Testament"]
        )
          throw new Error("Invalid coverage response");
        setChartData(data);
      } catch (failure) {
        if (!controller.signal.aborted) {
          console.error("Error loading coverage:", failure);
          setLoadError(true);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    void fetchData();
    return () => controller.abort();
  }, [filterOptions, refreshKey]);

  const isMobile = useMediaQuery("(max-width: 640px)");

  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const barChartData = chartData
    ? BIBLE_BOOKS.map((book) => {
        const bookData = [
          ...(chartData["Old Testament"]?.books || []),
          ...(chartData["New Testament"]?.books || []),
        ].find((b) => b.book === book);
        return {
          book: book,
          filtered_book_percentage: bookData
            ? Number(bookData.filtered_book_percentage.toFixed(2))
            : 0,
        };
      })
    : [];

  const mobileChartData = chartData
    ? barChartData
        .filter((book) => book.filtered_book_percentage > 0)
        .sort((a, b) => b.filtered_book_percentage - a.filtered_book_percentage)
        .slice(0, 20)
    : [];

  const [mobileChartView, setMobileChartView] = useState<"top" | "all">("top");

  const removeFilter = (filterType: keyof FilterOptions, value?: string) => {
    setFilterOptions((prev) => {
      if (filterType === "lyricsAdherence" && value) {
        return {
          ...prev,
          lyricsAdherence: prev.lyricsAdherence.filter((v) => v !== value),
        };
      } else {
        return {
          ...prev,
          [filterType]: filterType === "lyricsAdherence" ? [] : "all",
        };
      }
    });
  };

  const getFilterTags = (): {
    type: keyof FilterOptions;
    label: string;
    value?: string;
  }[] => {
    const tags: { type: keyof FilterOptions; label: string; value?: string }[] =
      [];
    if (filterOptions.lyricsAdherence.length > 0) {
      filterOptions.lyricsAdherence.forEach((value) => {
        tags.push({
          type: "lyricsAdherence",
          label: `Lyrics: ${value.replace(/_/g, " ")}`,
          value,
        });
      });
    }
    if (filterOptions.isContinuous !== "all") {
      tags.push({
        type: "isContinuous",
        label: `Passage: ${filterOptions.isContinuous === "true" ? "Continuous" : "Non-continuous"}`,
      });
    }
    if (filterOptions.aiMusic !== "all") {
      tags.push({
        type: "aiMusic",
        label: `Music: ${filterOptions.aiMusic === "true" ? "AI" : "Human"}`,
      });
    }
    return tags;
  };

  const stats = chartData
    ? {
        totalVersesCovered: chartData.bibleTotal.filtered_bible_verses_covered,
        totalVerses: chartData.bibleTotal.bible_total_verses,
        overallProgress: chartData.bibleTotal.filtered_bible_percentage,
        oldTestamentProgress:
          chartData["Old Testament"].filtered_testament_percentage,
        newTestamentProgress:
          chartData["New Testament"].filtered_testament_percentage,
        booksWithProgress: [
          ...(chartData["Old Testament"]?.books || []),
          ...(chartData["New Testament"]?.books || []),
        ].filter((book) => book.filtered_book_percentage > 0).length,
      }
    : {
        totalVersesCovered: 0,
        totalVerses: 0,
        overallProgress: 0,
        oldTestamentProgress: 0,
        newTestamentProgress: 0,
        booksWithProgress: 0,
      };

  return (
    <>
      <Head>
        <title>Scripture coverage · BibleChorus</title>
        <meta
          name="description"
          content="Explore the BibleChorus community’s progress setting Scripture to music."
        />
      </Head>
      <main className="page-shell">
        <header className="page-header">
          <div>
            <p className="page-eyebrow flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Every verse, a voice
            </p>
            <h1 className="page-title">See the story taking shape.</h1>
            <p className="page-description">
              Together, we’re setting Scripture to music. Explore the verses our
              community has covered, and find the next passage waiting for a
              song.
            </p>
          </div>
        </header>
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Verses in song",
              value: stats.totalVersesCovered.toLocaleString(),
            },
            {
              label: "Bible covered",
              value: `${stats.overallProgress.toFixed(1)}%`,
            },
            {
              label: "Books with music",
              value: stats.booksWithProgress.toString(),
            },
            {
              label: "Total Bible verses",
              value: stats.totalVerses.toLocaleString(),
            },
          ].map((stat) => (
            <div className="surface-card p-5 sm:p-6" key={stat.label}>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-primary">
                {isLoading && !chartData ? "—" : stat.value}
              </p>
            </div>
          ))}
        </div>
        <div className="surface-card mb-6 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Explore the coverage</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Filter by lyrics, passage style, or how the music was made.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              aria-expanded={isFilterExpanded}
              aria-controls="progress-filters"
            >
              <Filter className="mr-2 h-4 w-4" /> Filters
              {getFilterTags().length > 0 && (
                <span className="ml-2 text-xs">({getFilterTags().length})</span>
              )}
            </Button>
          </div>
          {isFilterExpanded && (
            <div
              id="progress-filters"
              className="mt-5 border-t border-border pt-5"
            >
              <Filters
                filterOptions={filterOptions}
                setFilterOptions={setFilterOptions}
                setIsFilterExpanded={setIsFilterExpanded}
              />
            </div>
          )}
          {getFilterTags().length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {getFilterTags().map((tag) => (
                <Badge
                  variant="secondary"
                  className="gap-2 rounded-full py-2"
                  key={`${tag.type}-${tag.value || ""}`}
                >
                  {tag.label}
                  <button
                    type="button"
                    onClick={() => removeFilter(tag.type, tag.value)}
                    aria-label={`Remove ${tag.label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
        {loadError && (
          <div
            role="alert"
            className="surface-card mb-6 flex flex-wrap items-center justify-between gap-3 p-5"
          >
            <div>
              <h2 className="font-semibold">Coverage couldn’t load.</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Please try again in a moment.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setRefreshKey((key) => key + 1)}
            >
              Try again
            </Button>
          </div>
        )}
        {isLoading && !chartData ? (
          <div
            role="status"
            aria-label="Loading Scripture coverage"
            className="surface-card p-10 text-center text-muted-foreground"
          >
            Loading the community’s progress…
          </div>
        ) : (
          chartData && (
            <div className="grid grid-cols-1 gap-6 sm:gap-10">
              {chartData && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <PieChartGroup
                    chartData={chartData}
                    filterOptions={filterOptions}
                    removeFilter={removeFilter}
                  />
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                <Card
                  className="surface-card overflow-hidden"
                  style={{
                    backgroundColor: theme.bgCard,
                  }}
                >
                  <CardHeader
                    className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 pb-6"
                    style={{
                      background: isDark
                        ? "linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, transparent 100%)"
                        : "linear-gradient(135deg, rgba(191, 161, 48, 0.08) 0%, transparent 100%)",
                      borderBottom: `1px solid ${theme.border}`,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="p-3 rounded-2xl backdrop-blur-sm"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(212, 175, 55, 0.15)"
                            : "rgba(191, 161, 48, 0.15)",
                          border: `1px solid ${isDark ? "rgba(212, 175, 55, 0.3)" : "rgba(191, 161, 48, 0.3)"}`,
                        }}
                      >
                        <TrendingUp
                          className="w-6 h-6"
                          style={{ color: theme.accent }}
                        />
                      </div>
                      <div>
                        <CardTitle
                          className="text-2xl font-bold"
                          style={{
                            color: theme.accent,
                            fontFamily: "'Italiana', serif",
                          }}
                        >
                          Bible Coverage by Book
                        </CardTitle>
                        <p
                          className="text-sm mt-1"
                          style={{
                            color: theme.textSecondary,
                            fontFamily: "'Manrope', sans-serif",
                          }}
                        >
                          Percentage of verses covered in each book of the Bible
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                      {getFilterTags().map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center gap-2 px-3 py-1.5 backdrop-blur-sm transition-all duration-300 rounded-xl"
                          style={{
                            backgroundColor: isDark
                              ? "rgba(212, 175, 55, 0.15)"
                              : "rgba(191, 161, 48, 0.15)",
                            border: `1px solid ${isDark ? "rgba(212, 175, 55, 0.3)" : "rgba(191, 161, 48, 0.3)"}`,
                            color: theme.text,
                          }}
                        >
                          <span
                            className="text-xs font-medium"
                            style={{ fontFamily: "'Manrope', sans-serif" }}
                          >
                            {tag.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFilter(tag.type, tag.value)}
                            aria-label={`Remove ${tag.label}`}
                            className="rounded-full text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-8">
                    {chartData && (
                      <div className="relative">
                        <div
                          className="absolute inset-0 rounded-2xl -m-2 sm:-m-4"
                          style={{
                            background: isDark
                              ? "radial-gradient(circle at center, rgba(212, 175, 55, 0.03), transparent 70%)"
                              : "radial-gradient(circle at center, rgba(191, 161, 48, 0.03), transparent 70%)",
                          }}
                        />
                        <div className="relative">
                          {isMobile ? (
                            <div className="space-y-6">
                              <div className="flex items-center justify-center gap-2 mb-4">
                                <button
                                  aria-pressed={mobileChartView === "top"}
                                  onClick={() => setMobileChartView("top")}
                                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300`}
                                  style={{
                                    background:
                                      mobileChartView === "top"
                                        ? `linear-gradient(135deg, ${theme.accent}, ${isDark ? "#e5c349" : "#d4af37"})`
                                        : isDark
                                          ? "rgba(255, 255, 255, 0.05)"
                                          : "rgba(0, 0, 0, 0.05)",
                                    color:
                                      mobileChartView === "top"
                                        ? "#ffffff"
                                        : theme.textSecondary,
                                    fontFamily: "'Manrope', sans-serif",
                                  }}
                                >
                                  Top Books ({mobileChartData.length})
                                </button>
                                <button
                                  aria-pressed={mobileChartView === "all"}
                                  onClick={() => setMobileChartView("all")}
                                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300`}
                                  style={{
                                    background:
                                      mobileChartView === "all"
                                        ? `linear-gradient(135deg, ${theme.accent}, ${isDark ? "#e5c349" : "#d4af37"})`
                                        : isDark
                                          ? "rgba(255, 255, 255, 0.05)"
                                          : "rgba(0, 0, 0, 0.05)",
                                    color:
                                      mobileChartView === "all"
                                        ? "#ffffff"
                                        : theme.textSecondary,
                                    fontFamily: "'Manrope', sans-serif",
                                  }}
                                >
                                  All Books
                                </button>
                              </div>

                              {mobileChartView === "top" ? (
                                <div className="space-y-3">
                                  {mobileChartData.map((book, index) => (
                                    <motion.div
                                      key={book.book}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{
                                        duration: 0.3,
                                        delay: index * 0.05,
                                      }}
                                      className="flex items-center justify-between p-3 sm:p-4 backdrop-blur-sm rounded-2xl transition-all duration-300"
                                      style={{
                                        backgroundColor: isDark
                                          ? "rgba(255, 255, 255, 0.03)"
                                          : "rgba(0, 0, 0, 0.02)",
                                        border: `1px solid ${theme.border}`,
                                      }}
                                    >
                                      <div className="flex items-center gap-2 sm:gap-3">
                                        <div
                                          className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs sm:text-sm font-bold"
                                          style={{
                                            backgroundColor: isDark
                                              ? "rgba(212, 175, 55, 0.2)"
                                              : "rgba(191, 161, 48, 0.2)",
                                            color: theme.accent,
                                            fontFamily: "'Italiana', serif",
                                          }}
                                        >
                                          {index + 1}
                                        </div>
                                        <div>
                                          <h4
                                            className="font-semibold text-sm sm:text-base"
                                            style={{
                                              color: theme.text,
                                              fontFamily:
                                                "'Manrope', sans-serif",
                                            }}
                                          >
                                            {book.book}
                                          </h4>
                                          <div className="flex items-center gap-2 mt-1">
                                            <div
                                              className="w-16 sm:w-20 h-2 rounded-full overflow-hidden"
                                              style={{
                                                backgroundColor: isDark
                                                  ? "rgba(255, 255, 255, 0.1)"
                                                  : "rgba(0, 0, 0, 0.1)",
                                              }}
                                            >
                                              <motion.div
                                                initial={{ width: 0 }}
                                                animate={{
                                                  width: `${Math.min(book.filtered_book_percentage, 100)}%`,
                                                }}
                                                transition={{
                                                  duration: 0.8,
                                                  delay: index * 0.05,
                                                }}
                                                className="h-full rounded-full"
                                                style={{
                                                  background: `linear-gradient(90deg, ${theme.accent}, ${isDark ? "#e5c349" : "#d4af37"})`,
                                                }}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end text-right min-w-[60px] sm:min-w-[80px]">
                                        <div
                                          className="text-base sm:text-lg font-bold leading-tight"
                                          style={{
                                            color: theme.accent,
                                            fontFamily: "'Italiana', serif",
                                          }}
                                        >
                                          {book.filtered_book_percentage.toFixed(
                                            1,
                                          )}
                                          %
                                        </div>
                                        <div
                                          className="text-xs leading-tight"
                                          style={{
                                            color: theme.textSecondary,
                                            fontFamily: "'Manrope', sans-serif",
                                          }}
                                        >
                                          covered
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}

                                  {mobileChartData.length === 0 && (
                                    <div
                                      className="text-center py-12"
                                      style={{ color: theme.textSecondary }}
                                    >
                                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                      <p
                                        style={{
                                          fontFamily: "'Manrope', sans-serif",
                                        }}
                                      >
                                        No books have been covered yet with the
                                        current filters.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <ChartContainer
                                  className="min-h-[1000px] max-w-full aspect-auto"
                                  config={{}}
                                >
                                  <BarChart
                                    data={barChartData}
                                    layout="vertical"
                                    width={400}
                                    height={Math.max(
                                      1000,
                                      barChartData.length * 24,
                                    )}
                                    margin={{
                                      top: 5,
                                      right: 15,
                                      left: 5,
                                      bottom: 5,
                                    }}
                                  >
                                    <defs>
                                      <linearGradient
                                        id="barGradientGold"
                                        x1="0"
                                        y1="0"
                                        x2="1"
                                        y2="0"
                                      >
                                        <stop
                                          offset="0%"
                                          stopColor={theme.accent}
                                        />
                                        <stop
                                          offset="100%"
                                          stopColor={theme.accentHover}
                                        />
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      stroke={
                                        isDark
                                          ? "rgba(255,255,255,0.1)"
                                          : "rgba(0,0,0,0.1)"
                                      }
                                    />
                                    <XAxis
                                      type="number"
                                      tickFormatter={(value) => `${value}%`}
                                      stroke={theme.textSecondary}
                                    />
                                    <YAxis
                                      dataKey="book"
                                      type="category"
                                      width={90}
                                      tick={{
                                        fontSize: 11,
                                        fill: theme.textSecondary,
                                      }}
                                      interval={0}
                                      tickFormatter={(value) => value}
                                    />
                                    <RechartsTooltip
                                      content={
                                        <ChartTooltipContent showPercentage />
                                      }
                                    />
                                    <Bar
                                      dataKey="filtered_book_percentage"
                                      fill="url(#barGradientGold)"
                                      name="Percent Covered:"
                                      radius={[0, 4, 4, 0]}
                                    />
                                  </BarChart>
                                </ChartContainer>
                              )}
                            </div>
                          ) : (
                            <ChartContainer
                              className="min-h-[400px] max-w-full overflow-x-auto"
                              config={{}}
                            >
                              <BarChart
                                data={barChartData}
                                layout="horizontal"
                                height={400}
                                margin={{
                                  top: 5,
                                  right: 30,
                                  left: 5,
                                  bottom: 5,
                                }}
                              >
                                <defs>
                                  <linearGradient
                                    id="barGradientGoldDesktop"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor={theme.accent}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor={theme.accentHover}
                                    />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke={
                                    isDark
                                      ? "rgba(255,255,255,0.1)"
                                      : "rgba(0,0,0,0.1)"
                                  }
                                />
                                <XAxis
                                  dataKey="book"
                                  tick={{
                                    fontSize: 11,
                                    fill: theme.textSecondary,
                                  }}
                                  angle={-40}
                                  textAnchor="end"
                                  interval={0}
                                  height={55}
                                  tickFormatter={(value, index) =>
                                    index % 5 === 0 ? value : ""
                                  }
                                />
                                <YAxis
                                  tickFormatter={(value) =>
                                    `${value.toFixed(2)}%`
                                  }
                                  stroke={theme.textSecondary}
                                />
                                <RechartsTooltip
                                  content={
                                    <ChartTooltipContent showPercentage />
                                  }
                                />
                                <Bar
                                  dataKey="filtered_book_percentage"
                                  fill="url(#barGradientGoldDesktop)"
                                  name="Percent Covered:"
                                  radius={[4, 4, 0, 0]}
                                >
                                  {barChartData.map((entry, index) => (
                                    <Cell key={`cell-${entry.book}-${index}`} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ChartContainer>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )
        )}
      </main>
    </>
  );
}
