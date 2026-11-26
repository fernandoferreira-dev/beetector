//tudo oq tem a ver com apiarios e colmeias, incluindo a listagem de apiarios, é um mockup/placeholder copiado do figma.

import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import HiveIcon from "@iconify-icons/mdi/beehive-outline";
import MagnifyIcon from "@iconify-icons/mdi/magnify";
import PencilIcon from "@iconify-icons/mdi/pencil";
import PlusIcon from "@iconify-icons/mdi/plus";
import BeeIcon from "@iconify-icons/roentgen/bee";

import { AppIcon } from "@/components/utilities/AppIcon";

type HiveStatus = "alarm" | "calm" | "active";

type Hive = {
  id: string;
  name: string;
  status: HiveStatus;
  currentState: string;
  temperature: string;
  humidity: string;
  passagesPerHour: string;
};

type Apiary = {
  id: string;
  name: string;
  gps: string;
  hiveCount: string;
  hives: Hive[];
};

// isto é tudo placeholder
const PLACEHOLDER_APIARIES: Apiary[] = [
  {
    id: "apiary-1",
    name: "Danela",
    gps: "XXXX, -XXXXX",
    hiveCount: "x",
    hives: [],
  },
  {
    id: "apiary-2",
    name: "L9 HeadQuarters",
    gps: "XXXX, -XXXXX",
    hiveCount: "x",
    hives: [
      {
        id: "hive-1",
        name: "Fernando -1",
        status: "calm",
        currentState: "xxx",
        temperature: "xx",
        humidity: "xx",
        passagesPerHour: "xxx",
      },
      {
        id: "hive-0",
        name: "Fernando -0",
        status: "active",
        currentState: "xxx",
        temperature: "xx",
        humidity: "xx",
        passagesPerHour: "xxx",
      },
    ],
  },
];
//fim das coisas placeholder

type Filter = "all" | HiveStatus;

const FILTERS: { key: Filter; label: string; dotClass?: string }[] = [
  { key: "all", label: "Todos" },
  { key: "alarm", label: "Alarme/ Sem Rainha", dotClass: "bg-[#E5446D]" },
  { key: "calm", label: "Calma", dotClass: "bg-[#5CD6B0]" },
  { key: "active", label: "Ativa", dotClass: "bg-[#3F3FD9]" },
];

function FilterChip({
  label,
  dotClass,
  selected,
  onPress,
}: {
  label: string;
  dotClass?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center rounded-full px-3 py-1.5 mr-2 shrink-0 ${selected ? "bg-[#F59E0B]" : "bg-white"
        }`}
    >
      {dotClass ? (
        <View className={`h-2.5 w-2.5 rounded-full mr-1.5 ${dotClass}`} />
      ) : null}
      <Text
        className={`text-sm font-semibold ${selected ? "text-white" : "text-black"
          }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function HiveRow({ hive, onPress }: { hive: Hive; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-[#F4E9D6] border border-[#EBD5A8] rounded-lg px-2 py-2 mb-2"
    >
      <View className="h-12 w-12 rounded-full bg-[#FFF4D6] items-center justify-center mr-3">
        <AppIcon icon={BeeIcon} size={32} color="#F5B400" />
      </View>

      <View className="flex-1">
        <Text className="text-base font-bold text-black">{hive.name}</Text>
        <Text className="text-sm font-semibold text-gray-500">
          Estado Atual - {hive.currentState}
        </Text>
        <Text className="text-sm text-gray-500">
          Temp/Hum: {hive.temperature}°C / {hive.humidity}%
        </Text>
        <Text className="text-[11px] text-gray-500">
          Passagens: {hive.passagesPerHour}/h
        </Text>
      </View>

      <AppIcon icon={HiveIcon} size={20} color="#6B7280" />
    </Pressable>
  );
}

function ApiaryCard({
  apiary,
  expanded,
  onToggle,
  onEdit,
  onOpenHive,
  visibleHives,
}: {
  apiary: Apiary;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onOpenHive: (hive: Hive) => void;
  visibleHives: Hive[];
}) {
  return (
    <View
      className={`bg-white rounded-xl mb-4 overflow-hidden ${expanded ? "border border-gray-400" : ""
        }`}
    >
      <View className="flex-row items-center p-3">
        <View className="h-14 w-14 rounded-xl bg-[#FFF4D6] border border-[#F5C26B] items-center justify-center mr-3">
          <AppIcon icon={BeeIcon} size={34} color="#F59E0B" />
        </View>

        <View className="flex-1">
          <Text className="text-base font-bold text-black">{apiary.name}</Text>
          <Text className="text-xs text-gray-500 mt-0.5">
            GPS: {apiary.gps}
          </Text>
          <View className="self-start bg-gray-200 rounded-full px-2 py-0.5 mt-1">
            <Text className="text-xs font-semibold text-gray-600">
              {apiary.hiveCount} colmeias
            </Text>
          </View>
        </View>

        <Pressable onPress={onEdit} hitSlop={8} className="mr-3">
          <AppIcon icon={PencilIcon} size={22} color="#6B7280" />
        </Pressable>
        <Pressable onPress={onToggle} hitSlop={8}>
          <Text className="text-gray-500 -rotate-90 text-xl">&lt;</Text>
        </Pressable>
      </View>

      {expanded && visibleHives.length > 0 ? (
        <View className="bg-[#F3F3F3] px-2 pt-2 pb-1">
          {visibleHives.map((hive) => (
            <HiveRow
              key={hive.id}
              hive={hive}
              onPress={() => onOpenHive(hive)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function ApiariesScreen() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<string | null>("apiary-2");

  const apiaries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return PLACEHOLDER_APIARIES.filter((a) =>
      query ? a.name.toLowerCase().includes(query) : true,
    );
  }, [search]);

  const hivesFor = (apiary: Apiary) =>
    filter === "all"
      ? apiary.hives
      : apiary.hives.filter((h) => h.status === filter);

  return (
    <View className="flex-1 bg-[#F0F0F0]">
      <View className="flex-row items-center px-4 pt-8 pb-3">
        <View className="flex-1 flex-row items-center bg-[#FBF9F2] border border-gray-400 rounded-xl px-3 h-12 mr-3">
          <AppIcon icon={MagnifyIcon} size={24} color="#6B7280" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Pesquisar apiário..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-2 text-base text-black"
          />
        </View>

        <Pressable
          onPress={() => {
            // todo: popup de novo apiario
          }}
          className="flex-row items-center bg-[#F59E0B] rounded-xl h-12 px-4"
        >
          <AppIcon icon={PlusIcon} size={22} color="#FFFFFF" />
          <Text className="ml-1.5 text-base font-bold text-white">
            Novo Apiário
          </Text>
        </Pressable>
      </View>

      {/* filtros*/}
      <View className="pb-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="grow-0"
          contentContainerClassName="px-4 items-center"
        >
          {FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              dotClass={f.dotClass}
              selected={filter === f.key}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </ScrollView>
      </View>

      {/* lista de apiarios */}
      <FlatList
        data={apiaries}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-8"
        renderItem={({ item }) => (
          <ApiaryCard
            apiary={item}
            expanded={expandedId === item.id}
            visibleHives={hivesFor(item)}
            onToggle={() =>
              setExpandedId((prev) => (prev === item.id ? null : item.id))
            }
            onEdit={() => {
              // todo: edição de apiário
            }}
            onOpenHive={() => {
              // todo: detalhes da colmeia/apiario
            }}
          />
        )}
      />
    </View>
  );
}
