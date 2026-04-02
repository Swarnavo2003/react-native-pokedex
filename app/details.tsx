import { BASE_URL } from "@/utils/config";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface PokemonDetail {
  id: number;
  name: string;
  image: string;
  types: { type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  abilities: { ability: { name: string }; is_hidden: boolean }[];
  height: number;
  weight: number;
  base_experience: number;
  species_url: string;
  description: string;
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

const statLabels: Record<string, string> = {
  hp: "HP",
  attack: "ATK",
  defense: "DEF",
  "special-attack": "SP.ATK",
  "special-defense": "SP.DEF",
  speed: "SPD",
};

function padId(id: number) {
  return String(id).padStart(3, "0");
}

export default function Details() {
  const { name, color } = useLocalSearchParams<{
    name: string;
    color: string;
  }>();
  const router = useRouter();
  const [pokemon, setPokemon] = useState<PokemonDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (name) fetchPokemonByName(name);
  }, [name]);

  async function fetchPokemonByName(name: string) {
    try {
      const res = await fetch(`${BASE_URL}/${name}`);
      const data = await res.json();

      // Fetch species for flavor text
      const speciesRes = await fetch(data.species.url);
      const speciesData = await speciesRes.json();
      const englishEntry = speciesData.flavor_text_entries.find(
        (e: any) => e.language.name === "en",
      );

      setPokemon({
        id: data.id,
        name: data.name,
        image:
          data.sprites.other["official-artwork"].front_default ||
          data.sprites.front_default,
        types: data.types,
        stats: data.stats,
        abilities: data.abilities,
        height: data.height,
        weight: data.weight,
        base_experience: data.base_experience,
        species_url: data.species.url,
        description: englishEntry
          ? englishEntry.flavor_text.replace(/\f|\n/g, " ")
          : "",
      });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={color || "#EF4444"} size="large" />
      </View>
    );
  }

  if (!pokemon) return null;

  const primaryType = pokemon.types[0].type.name;
  const cfg = typeConfig[primaryType] ?? {
    color: "#888",
    dark: "#333",
    emoji: "?",
  };
  const accentColor = cfg.color;

  return (
    <View style={styles.root}>
      {/* ── Hero Section ── */}
      <View style={[styles.hero, { backgroundColor: accentColor + "18" }]}>
        {/* Decorative circles */}
        <View
          style={[styles.heroBubbleLarge, { borderColor: accentColor + "20" }]}
        />
        <View
          style={[styles.heroBubbleSmall, { borderColor: accentColor + "30" }]}
        />

        {/* Grabber handle */}
        <View
          style={[styles.grabber, { backgroundColor: accentColor + "50" }]}
        />

        {/* Header row */}
        <View style={styles.heroHeader}>
          <View>
            <Text style={[styles.heroId, { color: accentColor + "70" }]}>
              #{padId(pokemon.id)}
            </Text>
            <Text style={styles.heroName}>
              {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
            </Text>

            {/* Type badges */}
            <View style={styles.typeBadgeRow}>
              {pokemon.types.map((t) => {
                const tcfg = typeConfig[t.type.name];
                return (
                  <View
                    key={t.type.name}
                    style={[
                      styles.typeBadge,
                      { backgroundColor: tcfg?.color ?? "#888" },
                    ]}
                  >
                    <Text style={styles.typeBadgeText}>
                      {tcfg?.emoji} {t.type.name.toUpperCase()}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Artwork */}
          <View style={styles.heroImageWrap}>
            <View
              style={[
                styles.heroImageGlow,
                { backgroundColor: accentColor + "30" },
              ]}
            />
            <Image
              source={{ uri: pokemon.image }}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Flavor text */}
        {!!pokemon.description && (
          <Text style={styles.description}>{pokemon.description}</Text>
        )}

        {/* Physical info row */}
        <View style={styles.infoRow}>
          <InfoPill
            label="Height"
            value={`${(pokemon.height / 10).toFixed(1)} m`}
            color={accentColor}
          />
          <InfoPill
            label="Weight"
            value={`${(pokemon.weight / 10).toFixed(1)} kg`}
            color={accentColor}
          />
          <InfoPill
            label="Base XP"
            value={`${pokemon.base_experience}`}
            color={accentColor}
          />
        </View>

        {/* Abilities */}
        <SectionTitle label="ABILITIES" color={accentColor} />
        <View style={styles.abilitiesRow}>
          {pokemon.abilities.map((a) => (
            <View
              key={a.ability.name}
              style={[
                styles.abilityChip,
                a.is_hidden && {
                  borderColor: accentColor + "80",
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={styles.abilityText}>
                {a.ability.name.replace("-", " ")}
              </Text>
              {a.is_hidden && (
                <Text style={[styles.hiddenTag, { color: accentColor }]}>
                  HIDDEN
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Base Stats */}
        <SectionTitle label="BASE STATS" color={accentColor} />
        <View style={styles.statsBlock}>
          {pokemon.stats.map((s) => (
            <StatRow
              key={s.stat.name}
              label={statLabels[s.stat.name] ?? s.stat.name.toUpperCase()}
              value={s.base_stat}
              color={accentColor}
            />
          ))}
        </View>

        {/* Total */}
        <View style={[styles.totalRow, { borderColor: accentColor + "30" }]}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={[styles.totalValue, { color: accentColor }]}>
            {pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0)}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/* ── Sub-components ── */

function SectionTitle({ label, color }: { label: string; color: string }) {
  return (
    <View style={sectionStyles.row}>
      <View style={[sectionStyles.dot, { backgroundColor: color }]} />
      <Text style={sectionStyles.text}>{label}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 24,
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  text: { fontSize: 10, fontWeight: "800", color: "#6B7280", letterSpacing: 2 },
});

function InfoPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={[pillStyles.pill, { borderColor: color + "30" }]}>
      <Text style={pillStyles.label}>{label}</Text>
      <Text style={[pillStyles.value, { color }]}>{value}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: "#1A1D27",
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: { fontSize: 15, fontWeight: "800" },
});

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const pct = Math.min(value / 255, 1);
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
      <Text style={[statStyles.value, { color }]}>{value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
    width: 54,
    letterSpacing: 0.5,
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: "#FFFFFF0F",
    borderRadius: 3,
    overflow: "hidden",
    marginHorizontal: 10,
  },
  fill: { height: "100%", borderRadius: 3 },
  value: { fontSize: 12, fontWeight: "800", width: 30, textAlign: "right" },
});

/* ── Main Styles ── */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0F1117",
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: "#0F1117",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Hero */
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    overflow: "hidden",
    position: "relative",
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 20,
  },
  heroBubbleLarge: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    top: -80,
    right: -80,
  },
  heroBubbleSmall: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    top: -20,
    right: 40,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  heroId: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 2,
  },
  heroName: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  typeBadgeRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.8,
  },
  heroImageWrap: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  heroImageGlow: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  heroImage: {
    width: 140,
    height: 140,
  },

  /* Body */
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 48,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: "#9CA3AF",
    fontStyle: "italic",
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  abilitiesRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  abilityChip: {
    backgroundColor: "#1A1D27",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  abilityText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E5E7EB",
    textTransform: "capitalize",
  },
  hiddenTag: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  statsBlock: {
    gap: 2,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6B7280",
    letterSpacing: 2,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "900",
  },
});
