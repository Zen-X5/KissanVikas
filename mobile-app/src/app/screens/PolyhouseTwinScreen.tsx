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
import { useAppDispatch, useAppSelector } from "../../../lib/store/store";
import { logout } from "../../../lib/store/authSlice";
import { PolyhouseMap } from "@/components/PoluhouseMap";
import { ObjectInspector } from "@/components/ObjectInspector";

export const PolyhouseTwinScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);

  const { data, isLoading, isError, refetch } = useGetPolyhouseTwinQuery();

  const [selectedObject, setSelectedObject] = useState<SpatialObject | null>(
    null
  );
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  // Extract unique crop species/classes for quick filter chips
  const cropCategories: string[] = useMemo(() => {
    if (!data?.objects) return ["ALL"];
    const crops = data.objects.filter((o: SpatialObject) => o.type === "crop");
    const classes = Array.from(new Set<string>(crops.map((c: SpatialObject) => c.class_name)));
    return ["ALL", "zones", "beds", ...classes];
  }, [data]);


  // Filter map objects based on selected category chip
  const filteredObjects: SpatialObject[] = useMemo(() => {
    if (!data?.objects) return [];
    if (activeCategory === "ALL") return data.objects;

    if (activeCategory === "zones") {
      return data.objects.filter(
        (o: SpatialObject) => o.type === "zone" || o.type === "structure"
      );
    }

    if (activeCategory === "beds") {
      return data.objects.filter(
        (o: SpatialObject) => o.type === "bed" || o.type === "zone" || o.type === "structure"
      );
    }

    // Preserve context: Keep structures and zones visible while filtering crops
    return data.objects.filter(
      (o: SpatialObject) =>
        o.type === "structure" ||
        o.type === "zone" ||
        o.class_name === activeCategory
    );
  }, [data, activeCategory]);


  const handleSignOut = () => {
    dispatch(logout());
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading Polyhouse Digital Twin...</Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Connection Failed</Text>
        <Text style={styles.errorSub}>
          Unable to fetch spatial digital twin data from backend.
        </Text>
        <Pressable style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryBtnText}>Retry Connection</Text>
        </Pressable>
        <Pressable style={styles.signOutSubBtn} onPress={handleSignOut}>
          <Text style={styles.signOutSubBtnText}>Sign Out</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header & Navigation Bar */}
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <View style={styles.headerTitles}>
            <View style={styles.farmerRow}>
              <View style={styles.farmerDot} />
              <Text style={styles.farmerName}>
                {currentUser?.name || "Customer Farm"}
              </Text>
            </View>
            <Text style={styles.headerTitle}>
              {data.facility_name || "Smart Polyhouse Twin #1"}
            </Text>
            <Text style={styles.headerSub}>
              Facility: <Text style={styles.headerSubHighlight}>{data.polyhouse_id}</Text>
              {" • "}
              <Text style={styles.dimHighlight}>
                {data.dimensions?.width_m || 60}m × {data.dimensions?.depth_m || 30}m
              </Text>
            </Text>
          </View>

          {/* Action Controls: Live Pill & Sign Out */}
          <View style={styles.headerActions}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{filteredObjects.length} Entities</Text>
            </View>

            <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
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
    backgroundColor: "#070A12",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#070A12",
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
    backgroundColor: "#10B981",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: "#070A12",
    fontWeight: "800",
    fontSize: 13,
  },
  signOutSubBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  signOutSubBtnText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: "rgba(11, 17, 30, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    zIndex: 10,
  },
  headerMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerTitles: {
    flex: 1,
    marginRight: 10,
  },
  farmerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  farmerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  farmerName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#34D399",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  headerSubHighlight: {
    color: "#38BDF8",
    fontWeight: "600",
  },
  dimHighlight: {
    color: "#CBD5E1",
    fontWeight: "500",
  },
  headerActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  liveText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#34D399",
  },
  signOutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  signOutText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#F87171",
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: 18,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
  },
  filterChipActive: {
    backgroundColor: "#10B981",
    borderColor: "#34D399",
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.4,
  },
  filterChipTextActive: {
    color: "#070A12",
  },
  mapContainer: {
    flex: 1,
  },
});
