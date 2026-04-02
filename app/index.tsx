import { BASE_URL } from "@/utils/config";
import { Link } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Pokemon {
  name: string;
  image: string;
  imageBack: string;
  types: PokemonType[];
  id: number;
  stats: { base_stat: number; stat: { name: string } }[];
}

interface PokemonType {
  type: { name: string; url: string };
}

const typeConfig: Record<
  string,
  { color: string; dark: string; emoji: string }
> = {
  normal: { color: "#A8A878", dark: "#6D6D4E", emoji: "⭐" },
  fire: { color: "#F08030", dark: "#9C531F", emoji: "🔥" },
  water: { color: "#6890F0", dark: "#445E9C", emoji: "💧" },
  electric: { color: "#F8D030", dark: "#A1871F", emoji: "⚡" },
  grass: { color: "#78C850", dark: "#4E8234", emoji: "🌿" },
  ice: { color: "#98D8D8", dark: "#638D8D", emoji: "❄️" },
  fighting: { color: "#C03028", dark: "#7D1F1A", emoji: "🥊" },
  poison: { color: "#A040A0", dark: "#682A68", emoji: "☠️" },
  ground: { color: "#E0C068", dark: "#927D44", emoji: "🌍" },
  flying: { color: "#A890F0", dark: "#6D5E9C", emoji: "🌪️" },
  psychic: { color: "#F85888", dark: "#A13959", emoji: "🔮" },
  bug: { color: "#A8B820", dark: "#6D7815", emoji: "🐛" },
  rock: { color: "#B8A038", dark: "#786824", emoji: "🪨" },
  ghost: { color: "#705898", dark: "#493963", emoji: "👻" },
  dragon: { color: "#7038F8", dark: "#4924A1", emoji: "🐉" },
  dark: { color: "#705848", dark: "#49392F", emoji: "🌑" },
  steel: { color: "#B8B8D0", dark: "#787887", emoji: "⚙️" },
  fairy: { color: "#EE99AC", dark: "#9B6470", emoji: "✨" },
};

type SortKey = "id" | "name" | "hp" | "atk" | "spd";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "id", label: "#ID" },
  { key: "name", label: "A–Z" },
  { key: "hp", label: "HP" },
  { key: "atk", label: "ATK" },
  { key: "spd", label: "SPD" },
];

const PAGE_SIZE = 10;
const TOTAL_POKEMON = 151; // Gen 1 — change to 1025 for all
const TOTAL_PAGES = Math.ceil(TOTAL_POKEMON / PAGE_SIZE);

function padId(id: number) {
  return String(id).padStart(3, "0");
}

async function fetchPage(page: number): Promise<Pokemon[]> {
  const offset = (page - 1) * PAGE_SIZE;
  const response = await fetch(
    `${BASE_URL}/?limit=${PAGE_SIZE}&offset=${offset}`,
  );
  const data = await response.json();
  return Promise.all(
    data.results.map(async (p: any) => {
      const res = await fetch(p.url);
      const d = await res.json();
      return {
        name: p.name,
        image:
          d.sprites.other["official-artwork"].front_default ||
          d.sprites.front_default,
        imageBack: d.sprites.back_default,
        types: d.types,
        id: d.id,
        stats: d.stats,
      };
    }),
  );
}

async function searchPokemon(query: string): Promise<Pokemon | null> {
  try {
    const res = await fetch(`${BASE_URL}/${query.toLowerCase().trim()}`);
    if (!res.ok) return null;
    const d = await res.json();
    return {
      name: d.name,
      image:
        d.sprites.other["official-artwork"].front_default ||
        d.sprites.front_default,
      imageBack: d.sprites.back_default,
      types: d.types,
      id: d.id,
      stats: d.stats,
    };
  } catch {
    return null;
  }
}

function getStat(pokemon: Pokemon, key: string) {
  return pokemon.stats.find((s) => s.stat.name === key)?.base_stat ?? 0;
}

/** Build a compact page range: 1 2 … 5 … 14 15 */
function buildPageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  for (
    let p = Math.max(2, current - 1);
    p <= Math.min(total - 1, current + 1);
    p++
  ) {
    pages.push(p);
  }
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

export default function Index() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<Pokemon[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchNotFound, setSearchNotFound] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  console.log(BASE_URL);

  useEffect(() => {
    loadPage(page);
  }, [page]);

  async function loadPage(p: number) {
    setLoading(true);
    try {
      setPokemons(await fetchPage(p));
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) {
      setSearchResult(null);
      setSearchNotFound(false);
      return;
    }
    // Instant local filter
    const local = pokemons.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    if (local.length > 0) {
      setSearchResult(local);
      setSearchNotFound(false);
      return;
    }
    // Fallback: exact API lookup with debounce
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const result = await searchPokemon(searchQuery);
      setSearchResult(result ? [result] : []);
      setSearchNotFound(!result);
      setSearching(false);
    }, 500);
  }, [searchQuery]);

  function handlePageChange(newPage: number) {
    if (newPage < 1 || newPage > TOTAL_PAGES) return;
    setPage(newPage);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  const displayList = (searchResult ?? pokemons).slice().sort((a, b) => {
    switch (sortKey) {
      case "id":
        return a.id - b.id;
      case "name":
        return a.name.localeCompare(b.name);
      case "hp":
        return getStat(b, "hp") - getStat(a, "hp");
      case "atk":
        return getStat(b, "attack") - getStat(a, "attack");
      case "spd":
        return getStat(b, "speed") - getStat(a, "speed");
    }
  });

  const isSearchMode = searchQuery.trim().length > 0;

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Header ── */}
      <View style={styles.headerSection}>
        <View style={styles.headerAccent} />
        <Text style={styles.headerEyebrow}>NATIONAL DEX</Text>
        <Text style={styles.headerTitle}>POKÉDEX</Text>
        <View style={styles.headerLine} />
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or exact ID…"
            placeholderTextColor="#4B5563"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setSearchResult(null);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Sort Pills ── */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>SORT</Text>
        <View style={styles.sortPills}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setSortKey(opt.key)}
              style={[
                styles.sortPill,
                sortKey === opt.key && styles.sortPillActive,
              ]}
            >
              <Text
                style={[
                  styles.sortPillText,
                  sortKey === opt.key && styles.sortPillTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Search state feedback ── */}
      {isSearchMode && (
        <Text style={styles.resultsMeta}>
          {searching
            ? "Searching across all Pokémon…"
            : searchNotFound
              ? `No Pokémon found for "${searchQuery}"`
              : `${displayList.length} result${displayList.length !== 1 ? "s" : ""} for "${searchQuery}"`}
        </Text>
      )}

      {/* ── Cards ── */}
      <View style={styles.cardList}>
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color="#EF4444" size="large" />
            <Text style={styles.loaderText}>Loading Pokémon…</Text>
          </View>
        ) : (
          displayList.map((pokemon) => {
            const primaryType = pokemon.types[0].type.name;
            const secondaryType = pokemon.types[1]?.type.name;
            const cfg = typeConfig[primaryType] ?? {
              color: "#888",
              dark: "#444",
              emoji: "?",
            };
            const cfg2 = secondaryType ? typeConfig[secondaryType] : null;
            const hp = getStat(pokemon, "hp");
            const atk = getStat(pokemon, "attack");
            const spd = getStat(pokemon, "speed");

            return (
              <Link
                key={pokemon.name}
                href={{
                  pathname: "/details",
                  params: { name: pokemon.name, color: cfg.color },
                }}
                style={styles.cardLink}
              >
                <View style={[styles.card, { borderColor: cfg.color + "60" }]}>
                  <View
                    style={[
                      styles.diagonalStripe,
                      { backgroundColor: cfg.color + "18" },
                    ]}
                  />
                  <Text
                    style={[styles.cardNumber, { color: cfg.color + "40" }]}
                  >
                    #{padId(pokemon.id)}
                  </Text>

                  <View style={styles.cardLeft}>
                    <View style={styles.typeBadgeRow}>
                      <View
                        style={[
                          styles.typeBadge,
                          { backgroundColor: cfg.color },
                        ]}
                      >
                        <Text style={styles.typeBadgeText}>
                          {cfg.emoji} {primaryType.toUpperCase()}
                        </Text>
                      </View>
                      {cfg2 && (
                        <View
                          style={[
                            styles.typeBadge,
                            { backgroundColor: cfg2.color },
                          ]}
                        >
                          <Text style={styles.typeBadgeText}>
                            {cfg2.emoji} {secondaryType!.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.pokemonName}>
                      {pokemon.name.charAt(0).toUpperCase() +
                        pokemon.name.slice(1)}
                    </Text>
                    <View style={styles.statsBlock}>
                      <StatBar label="HP" value={hp} color={cfg.color} />
                      <StatBar label="ATK" value={atk} color={cfg.color} />
                      <StatBar label="SPD" value={spd} color={cfg.color} />
                    </View>
                  </View>

                  <View style={styles.cardRight}>
                    <View
                      style={[
                        styles.imageGlow,
                        { backgroundColor: cfg.color + "22" },
                      ]}
                    />
                    <Image
                      source={{ uri: pokemon.image }}
                      style={styles.pokemonImage}
                      resizeMode="contain"
                    />
                  </View>

                  <View
                    style={[
                      styles.cardBottomBar,
                      { backgroundColor: cfg.color + "30" },
                    ]}
                  />
                </View>
              </Link>
            );
          })
        )}
      </View>

      {/* ── Pagination ── */}
      {!isSearchMode && !loading && (
        <>
          <View style={styles.pagination}>
            <TouchableOpacity
              onPress={() => handlePageChange(page - 1)}
              disabled={page === 1}
              style={[styles.pageArrow, page === 1 && styles.pageArrowDisabled]}
            >
              <Text style={styles.pageArrowText}>‹</Text>
            </TouchableOpacity>

            <View style={styles.pagePills}>
              {buildPageRange(page, TOTAL_PAGES).map((item, i) =>
                item === "…" ? (
                  <Text key={`e${i}`} style={styles.pageEllipsis}>
                    …
                  </Text>
                ) : (
                  <TouchableOpacity
                    key={item}
                    onPress={() => handlePageChange(item as number)}
                    style={[
                      styles.pagePill,
                      page === item && styles.pagePillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pagePillText,
                        page === item && styles.pagePillTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>

            <TouchableOpacity
              onPress={() => handlePageChange(page + 1)}
              disabled={page === TOTAL_PAGES}
              style={[
                styles.pageArrow,
                page === TOTAL_PAGES && styles.pageArrowDisabled,
              ]}
            >
              <Text style={styles.pageArrowText}>›</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.pageContext}>
            Page {page} of {TOTAL_PAGES}
            {"  ·  "}#{(page - 1) * PAGE_SIZE + 1}–#
            {Math.min(page * PAGE_SIZE, TOTAL_POKEMON)}
          </Text>
        </>
      )}
    </ScrollView>
  );
}

/* ── StatBar ── */
function StatBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const pct = Math.min(value / 160, 1);
  return (
    <View style={statStyles.row}>
      <Text style={statStyles.label}>{label}</Text>
      <View style={statStyles.track}>
        <View
          style={[
            statStyles.fill,
            { width: `${pct * 100}%` as any, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={statStyles.value}>{value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  label: {
    fontSize: 9,
    fontWeight: "700",
    color: "#9CA3AF",
    width: 28,
    letterSpacing: 0.5,
  },
  track: {
    flex: 1,
    height: 4,
    backgroundColor: "#FFFFFF10",
    borderRadius: 2,
    overflow: "hidden",
    marginHorizontal: 6,
  },
  fill: { height: "100%", borderRadius: 2 },
  value: {
    fontSize: 9,
    fontWeight: "600",
    color: "#9CA3AF",
    width: 22,
    textAlign: "right",
  },
});

/* ── Styles ── */
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0F1117",
    paddingBottom: 48,
    minHeight: "100%",
  },

  /* Header */
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 24,
    position: "relative",
    overflow: "hidden",
  },
  headerAccent: {
    position: "absolute",
    top: -60,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#EF4444",
    opacity: 0.08,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 4,
    color: "#EF4444",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 42,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  headerLine: {
    marginTop: 12,
    height: 2,
    width: 48,
    backgroundColor: "#EF4444",
    borderRadius: 1,
  },

  /* Search */
  searchWrap: { paddingHorizontal: 16, marginBottom: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1D27",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FFFFFF10",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    padding: 0,
  },
  clearBtn: { color: "#6B7280", fontSize: 12, fontWeight: "700" },

  /* Sort */
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#4B5563",
    letterSpacing: 2,
  },
  sortPills: { flexDirection: "row", gap: 6 },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#1A1D27",
    borderWidth: 1,
    borderColor: "#FFFFFF10",
  },
  sortPillActive: { backgroundColor: "#EF4444", borderColor: "#EF4444" },
  sortPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.5,
  },
  sortPillTextActive: { color: "#FFFFFF" },

  /* Results meta */
  resultsMeta: {
    paddingHorizontal: 20,
    marginBottom: 12,
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    fontStyle: "italic",
  },

  /* Cards */
  cardList: { paddingHorizontal: 16, gap: 14 },
  cardLink: { display: "flex" },
  card: {
    backgroundColor: "#1A1D27",
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 20,
    minHeight: 140,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  diagonalStripe: {
    position: "absolute",
    top: -30,
    right: -20,
    width: 180,
    height: 200,
    transform: [{ rotate: "20deg" }],
  },
  cardNumber: {
    position: "absolute",
    top: 10,
    right: 16,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
  cardBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  cardLeft: { flex: 1, paddingRight: 8 },
  typeBadgeRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.8,
  },
  pokemonName: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  statsBlock: { marginTop: 2 },
  cardRight: {
    width: 110,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  imageGlow: { position: "absolute", width: 90, height: 90, borderRadius: 45 },
  pokemonImage: { width: 110, height: 110, zIndex: 2 },

  /* Loader */
  loaderWrap: { paddingVertical: 60, alignItems: "center", gap: 12 },
  loaderText: {
    color: "#4B5563",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  /* Pagination */
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    gap: 8,
  },
  pagePills: { flexDirection: "row", alignItems: "center", gap: 5 },
  pagePill: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#1A1D27",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF10",
  },
  pagePillActive: { backgroundColor: "#EF4444", borderColor: "#EF4444" },
  pagePillText: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  pagePillTextActive: { color: "#FFFFFF" },
  pageEllipsis: {
    fontSize: 14,
    color: "#4B5563",
    paddingHorizontal: 2,
    fontWeight: "700",
  },
  pageArrow: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#1A1D27",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF15",
  },
  pageArrowDisabled: { opacity: 0.25 },
  pageArrowText: {
    fontSize: 22,
    color: "#EF4444",
    lineHeight: 26,
    fontWeight: "700",
  },
  pageContext: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 10,
    fontWeight: "600",
    color: "#374151",
    letterSpacing: 1,
  },
});
