import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from "react-native";
import {
  useGetPolyhouseTwinQuery,
  SpatialObject,
} from "../../../lib/services/polyhouse";
import { PolyhouseMap } from "@/components/PoluhouseMap";
import { ObjectInspector } from "@/components/ObjectInspector";

export const PolyhouseTwinScreen: React.FC = () => {
  const polyhouseId = "PH-DEMO-001";
  const { data, isLoading, isError, refetch } =
    useGetPolyhouseTwinQuery(polyhouseId);

  const [selectedObject, setSelectedObject] = useState<SpatialObject | null>(
    null,
  );
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  // Extract unique crop species/classes for quick filter chips
  const cropCategories = useMemo(() => {
    if (!data?.objects) return ["ALL"];
    const crops = data.objects.filter((o) => o.type === "crop");
    const classes = Array.from(new Set(crops.map((c) => c.class_name)));
    return ["ALL", "zones", "beds", ...classes];
  }, [data]);

  // Filter map objects based on selected category chip
  const filteredObjects = useMemo(() => {
    if (!data?.objects) return [];
    if (activeCategory === "ALL") return data.objects;

    if (activeCategory === "zones") {
      return data.objects.filter(
        (o) => o.type === "zone" || o.type === "structure",
      );
    }

    if (activeCategory === "beds") {
      return data.objects.filter(
        (o) => o.type === "bed" || o.type === "zone" || o.type === "structure",
      );
    }

    // Preserve context: Keep structures and zones visible while filtering crops
    return data.objects.filter(
      (o) =>
        o.type === "structure" ||
        o.type === "zone" ||
        o.class_name === activeCategory,
    );
  }, [data, activeCategory]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text style={styles.loadingText}>Loading Digital Twin Map...</Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Connection Failed</Text>
        <Text style={styles.errorSub}>
          Unable to fetch spatial digital twin data.
        </Text>
        <Pressable style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryBtnText}>Retry Connection</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header & Navigation Bar */}
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <View>
            <Text style={styles.headerTitle}>Polyhouse Digital Twin</Text>
            <Text style={styles.headerSub}>
              Facility ID:{" "}
              <Text style={styles.headerSubHighlight}>{data.polyhouse_id}</Text>
            </Text>
          </View>

          {/* Active Live Indicator Pill */}
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{filteredObjects.length} Active</Text>
          </View>
        </View>

        {/* Dynamic Category Filter Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {cropCategories.map((cat) => {
            const isActive = activeCategory === cat;
            const label = cat.replace("_", " ").toUpperCase();

            return (
              <Pressable
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Map Interactive Canvas */}
      <View style={styles.mapContainer}>
        <PolyhouseMap
          objects={filteredObjects}
          selectedObject={selectedObject}
          onSelectObject={(obj) => setSelectedObject(obj)}
        />
      </View>

      {/* Selected Spatial Object Inspector Overlay */}
      <ObjectInspector
        selectedObject={selectedObject}
        onClose={() => setSelectedObject(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E120B",
  },
  center: {
    flex: 1,
    justify: "center",
    alignItems: "center",
    backgroundColor: "#0F172A",
    padding: 24,
  },
  loadingText: {
    marginTop: 14,
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
  },
  errorTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorSub: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: "#0284C7",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  header: {
    paddingTop: 54,
    paddingBottom: 12,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    zIndex: 10,
  },
  headerMain: {
    flexDirection: "row",
    justify: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  headerSubHighlight: {
    color: "#38BDF8",
    fontWeight: "600",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  liveText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4ADE80",
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  filterChipActive: {
    backgroundColor: "#0284C7",
    borderColor: "#38BDF8",
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.4,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  mapContainer: {
    flex: 1,
  },
});
