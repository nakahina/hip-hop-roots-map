"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Icon } from "leaflet";
import { useState, useRef, useEffect } from "react";
import {
  Box,
  Flex,
  Input,
  Text,
  VStack,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  Select,
  Avatar,
  IconButton,
  Badge,
  HStack,
} from "@chakra-ui/react";
import {
  SearchIcon,
  AddIcon,
  MinusIcon,
  RepeatIcon,
  CloseIcon,
} from "@chakra-ui/icons";
import L from "leaflet";
import {
  FaFilter,
  FaPlay,
  FaHeart,
  FaMapMarkerAlt,
  FaInstagram,
  FaTwitter,
  FaFacebook,
  FaYoutube,
} from "react-icons/fa";
import { FaTiktok } from "react-icons/fa6";
import { useMap } from "react-leaflet";
import { YouTubeEmbed } from "./YouTubeEmbed";
import type { Artist } from "@/data/artist";
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

const icon = new Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
  className: "custom-marker",
});

export default function MapView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("all");
  const [sortOrder, setSortOrder] = useState("name");
  const [hoveredArtist, setHoveredArtist] = useState<Artist | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const queryParams = new URLSearchParams({
          search: searchTerm,
          style: selectedStyle,
          sort: sortOrder,
        });
        const response = await fetch(`/api/artists?${queryParams}`);
        if (!response.ok) {
          throw new Error("Failed to fetch artists");
        }
        const data = await response.json();
        setArtists(data);
      } catch (error) {
        console.error("Error fetching artists:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, [searchTerm, selectedStyle, sortOrder]);

  // 並び順のオプション
  const sortOptions = [
    { value: "name", label: "名前順" },
    { value: "prefecture", label: "都道府県順" },
  ];

  // 都道府県の順序を定義
  const prefectureOrder = [
    "北海道",
    "青森県",
    "岩手県",
    "宮城県",
    "秋田県",
    "山形県",
    "福島県",
    "茨城県",
    "栃木県",
    "群馬県",
    "埼玉県",
    "千葉県",
    "東京都",
    "神奈川県",
    "新潟県",
    "富山県",
    "石川県",
    "福井県",
    "山梨県",
    "長野県",
    "岐阜県",
    "静岡県",
    "愛知県",
    "三重県",
    "滋賀県",
    "京都府",
    "大阪府",
    "兵庫県",
    "奈良県",
    "和歌山県",
    "鳥取県",
    "島根県",
    "岡山県",
    "広島県",
    "山口県",
    "徳島県",
    "香川県",
    "愛媛県",
    "高知県",
    "福岡県",
    "佐賀県",
    "長崎県",
    "熊本県",
    "大分県",
    "宮崎県",
    "鹿児島県",
    "沖縄県",
  ];

  // 同じ座標のアーティストをグループ化して、オフセットを計算する関数
  const calculateMarkerPositions = (artistsList: Artist[]) => {
    const positionGroups = new Map<string, Artist[]>();

    // 同じ座標のアーティストをグループ化
    artistsList.forEach((artist: Artist) => {
      const key = `${artist.lat},${artist.lng}`;
      if (!positionGroups.has(key)) {
        positionGroups.set(key, []);
      }
      positionGroups.get(key)?.push(artist);
    });

    // 各グループに対してオフセットを計算
    const offsetPositions = new Map<string, { lat: number; lng: number }>();
    positionGroups.forEach((group, key) => {
      if (group.length === 1) {
        // 単独のマーカーはそのまま
        offsetPositions.set(key, { lat: group[0].lat, lng: group[0].lng });
      } else {
        // 複数のマーカーがある場合は円形に配置
        group.forEach((artist, index) => {
          const angle = (index * 2 * Math.PI) / group.length;
          const radius = 0.001; // オフセットの半径（約100m）
          const offsetLat = artist.lat + radius * Math.cos(angle);
          const offsetLng = artist.lng + radius * Math.sin(angle);
          // キーを一意にするために、アーティスト名も含める
          offsetPositions.set(`${key}-${artist.name}`, {
            lat: offsetLat,
            lng: offsetLng,
          });
        });
      }
    });

    return offsetPositions;
  };

  // カスタムdivIconを生成
  const createAnimatedIcon = (artist: (typeof artists)[0]) =>
    L.divIcon({
      className: "",
      html: `<div class='animated-marker'><div class='ripple'></div><div class='circle'><svg width='64' height='64' viewBox='0 0 48 48' fill='none'><defs><clipPath id="circleClip"><circle cx='24' cy='24' r='22'/></clipPath></defs><circle cx='24' cy='24' r='23' stroke='#FFD700' stroke-width='2' fill='#2d2300'/><image href="${artist.smallImage}" width="44" height="44" x="2" y="2" clip-path="url(#circleClip)" preserveAspectRatio="xMidYMid slice"/></svg></div></div>`,
      iconSize: [96, 96],
      iconAnchor: [48, 48],
      popupAnchor: [0, -48],
    });

  // Custom zoom/reset button component
  function MapControlButtons() {
    const map = useMap();
    return (
      <Flex
        position="absolute"
        top={4}
        right={4}
        zIndex={1000}
        direction="column"
        gap={2}
      >
        <IconButton
          aria-label="ズームイン"
          icon={<AddIcon />}
          colorScheme="yellow"
          variant="solid"
          size="md"
          isRound
          onClick={() => map.setZoom(map.getZoom() + 1)}
        />
        <IconButton
          aria-label="ズームアウト"
          icon={<MinusIcon />}
          colorScheme="yellow"
          variant="solid"
          size="md"
          isRound
          onClick={() => map.setZoom(map.getZoom() - 1)}
        />
        <IconButton
          aria-label="リセット"
          icon={<RepeatIcon />}
          colorScheme="gray"
          variant="solid"
          size="md"
          isRound
          onClick={() => map.setView([35.6895, 139.6917], 5)}
        />
      </Flex>
    );
  }

  return (
    <Box h="100vh" w="100vw" bg="gray.900">
      {/* Header */}
      <Box
        as="header"
        h="60px"
        w="100%"
        bg="black"
        px={8}
        display="flex"
        alignItems="center"
        boxShadow="sm"
        zIndex={10}
        position="relative"
        borderColor="gray.700"
        borderWidth="1px"
      >
        <Flex w="100%" align="center" justify="space-between">
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color="white"
            letterSpacing="wide"
          >
            {/* <span style={{ color: "#FDD835", fontWeight: "bold" }}>JP</span>{" "} */}
            <span style={{ color: "#FDD835", fontWeight: "bold" }}>HIPHOP</span>{" "}
            ROOTS
          </Text>
          <InputGroup w="300px">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="アーティスト名で検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg="gray.800"
              color="white"
              borderColor="gray.700"
              _hover={{ borderColor: "gray.600" }}
              _focus={{ borderColor: "purple.500", boxShadow: "none" }}
              _placeholder={{ color: "gray.400" }}
            />
          </InputGroup>
        </Flex>
      </Box>
      <Flex h="calc(100vh - 60px)" w="100vw">
        {/* Sidebar */}
        <Box
          w="350px"
          h="100%"
          bg="gray.900"
          borderRight="1px"
          borderColor="gray.700"
          p={6}
          overflowY="auto"
        >
          {loading ? (
            <Text color="gray.400">Loading...</Text>
          ) : (
            <>
              {/* スタイル選択 */}
              <Text fontSize="sm" color="gray.400" mb={1}>
                スタイル
              </Text>
              <Select
                mb={4}
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                bg="gray.800"
                color="gray.100"
                borderColor="gray.700"
                _hover={{ borderColor: "gray.600" }}
                _focus={{ borderColor: "purple.500", boxShadow: "none" }}
                fontSize="md"
              >
                <option value="all">すべてのスタイル</option>
                <option value="j-rap">J-RAP</option>
                <option value="j-pop">J-POP</option>
                <option value="j-r&b">J-R&B</option>
                <option value="reggae">REGGAE</option>
                <option value="hip hop">HIPHOP</option>
                <option value="thai hip hop">THAI HIP HOP</option>
                <option value="experimental hip hop">
                  EXPERIMENTAL HIP HOP
                </option>
                <option value="k-rap">K-RAP</option>
                <option value="japanese indie">JAPANESE INDIE</option>
                <option value="shibuya-kei">SHIPBUYA KEI</option>
                <option value="hyperpop">HYPERPOP</option>
                <option value="breakcore">BREAKCORE</option>
                <option value="jam band">JAM BAND</option>
                <option value="city pop">CITY POP</option>
              </Select>
              {/* 並び順選択 */}
              <Text fontSize="sm" color="gray.400" mb={1}>
                並び順
              </Text>
              <Select
                mb={6}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                bg="gray.800"
                color="gray.100"
                borderColor="gray.700"
                _hover={{ borderColor: "gray.600" }}
                _focus={{ borderColor: "purple.500", boxShadow: "none" }}
                fontSize="md"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
              {/* アーティスト数 */}
              <Text fontSize="sm" color="gray.300" mb={2}>
                {artists.length} アーティスト
              </Text>
              {/* アーティストリスト */}
              <VStack spacing={4} align="stretch">
                {artists.map((artist) => (
                  <Flex
                    key={artist.name}
                    p={4}
                    bg={
                      selectedArtist === artist.name ? "purple.500" : "gray.800"
                    }
                    color="white"
                    borderRadius="lg"
                    align="center"
                    gap={4}
                    boxShadow="sm"
                    cursor="pointer"
                    _hover={{
                      bg:
                        selectedArtist === artist.name
                          ? "purple.500"
                          : "gray.700",
                      transform: "translateY(-2px)",
                      transition: "all 0.2s",
                    }}
                    onClick={() => setHoveredArtist(artist)}
                    transition="all 0.2s"
                  >
                    {/* 丸いアイコン（画像 or イニシャル） */}
                    {artist.smallImage ? (
                      <Avatar
                        src={artist.smallImage}
                        name={artist.name}
                        size="md"
                        bg="yellow.400"
                        color="black"
                      />
                    ) : (
                      <Avatar
                        name={artist.name}
                        size="md"
                        bg="yellow.400"
                        color="black"
                      />
                    )}
                    <HStack w="100%">
                      <Box flex="1">
                        <Text fontWeight="bold" fontSize="md" mb={1}>
                          {artist.name}
                        </Text>
                        <Flex
                          align="center"
                          gap={2}
                          fontSize="smaller"
                          color="gray.300"
                        >
                          {artist.city && (
                            <HStack as="span" gap={1}>
                              <FaMapMarkerAlt />
                              <Text>{artist.city}</Text>
                            </HStack>
                          )}
                        </Flex>
                        {/* ジャンルバッジ */}
                        {artist.genres && artist.genres.length > 0 && (
                          <Flex gap={2} mt={2} flexWrap="wrap">
                            {artist.genres.map((genre) => (
                              <Badge
                                key={genre}
                                colorScheme="gray"
                                bg="gray.700"
                                color="gray.100"
                                borderRadius="md"
                                px={3}
                                py={1}
                                fontSize="x-small"
                              >
                                {genre}
                              </Badge>
                            ))}
                          </Flex>
                        )}
                      </Box>
                    </HStack>
                  </Flex>
                ))}
              </VStack>
            </>
          )}
        </Box>

        {/* Map */}
        <Box flex="1" position="relative">
          <MapContainer
            center={[35.6895, 139.6917]}
            zoom={5}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {!loading && (
              <MarkerClusterGroup
                chunkedLoading
                iconCreateFunction={(cluster: any) => {
                  const count = cluster.getChildCount();
                  return L.divIcon({
                    html: `<div style="background-color: #2d2300; color: #FFD700; border: 2px solid #FFD700; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold;">${count}</div>`,
                    className: "custom-cluster-icon",
                    iconSize: L.point(40, 40),
                  });
                }}
                spiderfyOnMaxZoom={false}
                showCoverageOnHover={false}
                zoomToBoundsOnClick={true}
                removeOutsideVisibleBounds={true}
                maxClusterRadius={80}
              >
                {(() => {
                  const offsetPositions = calculateMarkerPositions(artists);
                  return artists.map((artist) => {
                    const key = `${artist.lat},${artist.lng}`;
                    const position =
                      offsetPositions.get(`${key}-${artist.name}`) ||
                      offsetPositions.get(key);
                    if (!position) return null;

                    return (
                      <Marker
                        key={artist.name}
                        position={[position.lat, position.lng]}
                        icon={createAnimatedIcon(artist)}
                        eventHandlers={{
                          click: () => setHoveredArtist(artist),
                        }}
                      />
                    );
                  });
                })()}
              </MarkerClusterGroup>
            )}
            {/* Custom Zoom Buttons */}
            <MapControlButtons />
          </MapContainer>

          {/* Hover Profile */}
          {hoveredArtist && (
            <Box
              position="absolute"
              bottom={10}
              right={10}
              p={6}
              borderRadius="xl"
              boxShadow="2xl"
              w="400px"
              zIndex={1000}
              border="1px"
              borderColor="gray.700"
              backdropFilter="blur(10px)"
              bg="rgba(26, 32, 44, 0.95)"
              overflowY="auto"
            >
              <IconButton
                aria-label="close profile"
                position="absolute"
                top={3}
                right={3}
                icon={<CloseIcon />}
                size="sm"
                variant="ghost"
                color="gray.400"
                _hover={{ color: "white", bg: "gray.700" }}
                onClick={() => setHoveredArtist(null)}
              />
              <Flex align="center" gap={4} mb={4}>
                <Avatar
                  src={hoveredArtist.smallImage}
                  name={hoveredArtist.name}
                  size="xl"
                  border="2px"
                  borderColor="yellow.400"
                />
                <Box>
                  <Text
                    fontWeight="bold"
                    color="yellow.400"
                    fontSize="xl"
                    mb={1}
                  >
                    {hoveredArtist.name}
                  </Text>
                  <Flex align="center" gap={2} color="gray.400">
                    <FaMapMarkerAlt />
                    <Text fontSize="small">{hoveredArtist.city}</Text>
                  </Flex>
                  {hoveredArtist.genres && hoveredArtist.genres.length > 0 && (
                    <Box mt={2}>
                      <Flex gap={2} flexWrap="wrap">
                        {hoveredArtist.genres.map((genre) => (
                          <Badge
                            key={genre}
                            colorScheme="gray"
                            bg="gray.700"
                            color="gray.100"
                            borderRadius="md"
                            px={3}
                            py={1}
                            fontSize="xs"
                          >
                            {genre}
                          </Badge>
                        ))}
                      </Flex>
                    </Box>
                  )}
                </Box>
              </Flex>
              {hoveredArtist.youtubeUrl && (
                <Box mt={8}>
                  <Text fontSize="sm" color="gray.400" mb={2} fontWeight="bold">
                    代表曲
                  </Text>
                  <YouTubeEmbed videoId={hoveredArtist.youtubeUrl} />
                </Box>
              )}
              <Box mt={4}>
                <Text fontSize="sm" color="gray.400" mb={2} fontWeight="bold">
                  SNS
                </Text>
                <Flex gap={3}>
                  {hoveredArtist.instagramUrl && (
                    <IconButton
                      as="a"
                      href={hoveredArtist.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      icon={<FaInstagram />}
                      size="lg"
                      variant="ghost"
                      color="gray.400"
                      _hover={{ color: "#E1306C", bg: "gray.700" }}
                    />
                  )}
                  {hoveredArtist.twitterUrl && (
                    <IconButton
                      as="a"
                      href={hoveredArtist.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Twitter"
                      icon={<FaTwitter />}
                      size="lg"
                      variant="ghost"
                      color="gray.400"
                      _hover={{ color: "#1DA1F2", bg: "gray.700" }}
                    />
                  )}
                  {hoveredArtist.facebookUrl && (
                    <IconButton
                      as="a"
                      href={hoveredArtist.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      icon={<FaFacebook />}
                      size="lg"
                      variant="ghost"
                      color="gray.400"
                      _hover={{ color: "#4267B2", bg: "gray.700" }}
                    />
                  )}
                  {hoveredArtist.youtubeChannelUrl && (
                    <IconButton
                      as="a"
                      href={hoveredArtist.youtubeChannelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="YouTube"
                      icon={<FaYoutube />}
                      size="lg"
                      variant="ghost"
                      color="gray.400"
                      _hover={{ color: "#FF0000", bg: "gray.700" }}
                    />
                  )}
                  {hoveredArtist.tiktokUrl && (
                    <IconButton
                      as="a"
                      href={hoveredArtist.tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="TikTok"
                      icon={<FaTiktok />}
                      size="lg"
                      variant="ghost"
                      color="gray.400"
                      _hover={{ color: "#000000", bg: "gray.700" }}
                    />
                  )}
                </Flex>
              </Box>
            </Box>
          )}
        </Box>
      </Flex>
    </Box>
  );
}
