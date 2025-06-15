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
  InputRightElement,
  useBreakpointValue,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Button,
  Textarea,
  useToast,
  Image,
  Tooltip,
  Link,
  Divider,
} from "@chakra-ui/react";
import {
  SearchIcon,
  AddIcon,
  MinusIcon,
  RepeatIcon,
  CloseIcon,
  HamburgerIcon,
  EmailIcon,
  InfoIcon,
  QuestionIcon,
  AtSignIcon,
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
  FaShareAlt,
  FaInfoCircle,
  FaMap,
  FaEnvelope,
  FaGithub,
  FaHeart as FaHeartSolid,
  FaUsers,
  FaListUl,
  FaChevronRight,
  FaChevronLeft,
} from "react-icons/fa";
import { FaTiktok } from "react-icons/fa6";
import { FaLine } from "react-icons/fa6";
import { useMap } from "react-leaflet";
import { YouTubeEmbed } from "./YouTubeEmbed";
import type { Artist } from "@/data/artist";
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { SpotifyEmbed } from "./SpotifyEmbed";
import ContactForm from "./ContactForm";

const icon = new Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
  className: "custom-marker",
});

export default function MapView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("all");
  const [sortOrder, setSortOrder] = useState("name");
  const [hoveredArtist, setHoveredArtist] = useState<Artist | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [activeTab, setActiveTab] = useState<"map" | "artists" | "menu">("map");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Drawer用ドラッグイベントハンドラ（SP用）
  const touchStartYRef = useRef(0);
  const touchEndYRef = useRef(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!drawerRef.current) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartYRef.current;
    touchEndYRef.current = currentY; // 終了位置を記録

    // 上方向へのスワイプは無視
    if (deltaY < 0) return;

    // ドロワーの高さを調整
    const maxHeight = 395; // ドロワーの最大高さ
    const newHeight = Math.max(0, maxHeight - deltaY);
    drawerRef.current.style.maxHeight = `${newHeight}px`;

    // スワイプの進行度に応じて透明度を調整
    const opacity = 1 - deltaY / maxHeight;
    drawerRef.current.style.opacity = opacity.toString();
  };

  const handleTouchEnd = () => {
    if (!drawerRef.current) return;

    const deltaY = touchEndYRef.current - touchStartYRef.current;
    const threshold = 100; // スワイプのしきい値

    if (deltaY > threshold) {
      // しきい値を超えた場合、ドロワーを閉じる
      setHoveredArtist(null);
    } else {
      // しきい値未満の場合、元の位置に戻す
      drawerRef.current.style.maxHeight = "395px";
      drawerRef.current.style.opacity = "1";
    }

    touchStartYRef.current = 0;
    touchEndYRef.current = 0;
  };

  const handleSearch = () => {
    setSearchQuery(searchTerm);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleArtistClick = (artist: Artist) => {
    setSelectedArtist(artist.name);
    setHoveredArtist(artist);
    if (mapRef.current) {
      mapRef.current.setView([artist.lat, artist.lng], 12);
    }
  };

  useEffect(() => {
    const fetchArtists = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          search: searchQuery,
          style: selectedStyle,
          sort: sortOrder,
          withLocation: "true",
        });
        const response = await fetch(`/api/artists?${queryParams}`);
        if (!response.ok) {
          throw new Error("Failed to fetch artists");
        }
        const data = await response.json();
        setArtists(data);

        if (data.length > 0 && mapRef.current) {
          const bounds = L.latLngBounds(
            data.map((artist: Artist) => [artist.lat, artist.lng])
          );
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch (error) {
        console.error("Error fetching artists:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, [searchQuery, selectedStyle, sortOrder]);

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
        const baseRadius = 0.005; // 基本の半径（約300m）
        const maxRadius = 0.015; // 最大半径（約800m）

        // グループのサイズに応じて半径を調整
        const radius = Math.min(
          baseRadius * Math.sqrt(group.length),
          maxRadius
        );

        group.forEach((artist, index) => {
          const angle = (index * 2 * Math.PI) / group.length;
          const offsetLat = artist.lat + radius * Math.cos(angle);
          const offsetLng = artist.lng + radius * Math.sin(angle);

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

  const renderMobileNav = () => (
    <Flex
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg="gray.900"
      borderTop="1px"
      borderColor="gray.700"
      p={2}
      zIndex={1000}
      justify="space-around"
    >
      <IconButton
        aria-label="Map"
        icon={<FaMapMarkerAlt size={20} />}
        variant="ghost"
        color={
          activeTab === "map" && !showAbout && !showContact
            ? "yellow.400"
            : "gray.400"
        }
        onClick={() => {
          setActiveTab("map");
          setShowContact(false);
          setShowAbout(false);
        }}
      />
      <IconButton
        aria-label="Artist List"
        icon={<FaListUl size={20} />}
        variant="ghost"
        color={
          activeTab === "artists" && !showAbout && !showContact
            ? "yellow.400"
            : "gray.400"
        }
        onClick={() => {
          setActiveTab("artists");
          setShowContact(false);
          setShowAbout(false);
        }}
      />
    </Flex>
  );

  const renderSidebar = () => (
    <Box
      w={{ base: "100%", md: isSidebarCollapsed ? "80px" : "360px" }}
      h={{ base: "calc(100vh - 60px - 60px)", md: "calc(100vh - 60px)" }}
      bg="gray.900"
      borderRight={{ base: "none", md: "1px" }}
      borderColor="gray.700"
      p={6}
      overflowY="auto"
      transition="width 0.3s ease"
      position="relative"
    >
      {loading ? (
        <Text color="gray.400">Loading...</Text>
      ) : (
        <>
          {!isSidebarCollapsed && (
            <>
              <InputGroup w={{ base: "200px", md: "300px" }} mb={4}>
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  bg="gray.800"
                  color="white"
                  borderColor="gray.700"
                  _hover={{ borderColor: "gray.600" }}
                  _focus={{ borderColor: "purple.500", boxShadow: "none" }}
                  _placeholder={{ color: "gray.400" }}
                />
                <InputRightElement>
                  <IconButton
                    aria-label="検索"
                    icon={<SearchIcon />}
                    size="sm"
                    variant="ghost"
                    color="gray.400"
                    _hover={{ color: "white", bg: "gray.700" }}
                    onClick={handleSearch}
                  />
                </InputRightElement>
              </InputGroup>
              <Text fontSize="sm" color="gray.300" mb={2} letterSpacing="wider">
                {artists.length} ARTISTS
              </Text>
            </>
          )}
          <VStack spacing={4} align="stretch">
            {artists.map((artist) => (
              <Flex
                key={artist.name}
                p={isSidebarCollapsed ? 2 : 4}
                bg={
                  !isSidebarCollapsed
                    ? selectedArtist === artist.name
                      ? "yellow.400"
                      : "gray.800"
                    : "none"
                }
                color="white"
                borderRadius="lg"
                align="center"
                justify={isSidebarCollapsed ? "center" : "flex-start"}
                gap={4}
                boxShadow="sm"
                cursor="pointer"
                _hover={{
                  bg: !isSidebarCollapsed
                    ? selectedArtist === artist.name
                      ? "yellow.400"
                      : "gray.700"
                    : "none",
                  transform: "translateY(-2px)",
                  transition: "all 0.2s",
                }}
                onClick={() => handleArtistClick(artist)}
                transition="all 0.2s"
              >
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
                {!isSidebarCollapsed && (
                  <HStack w="100%">
                    <Box flex="1">
                      <Text
                        fontWeight="bold"
                        fontSize="md"
                        mb={1}
                        letterSpacing="wider"
                      >
                        {artist.name}
                      </Text>
                      <Flex align="center" gap={2} fontSize="smaller">
                        {artist.city && (
                          <HStack as="span" gap={1}>
                            <FaMapMarkerAlt />
                            <Text>{artist.city}</Text>
                          </HStack>
                        )}
                      </Flex>
                      {artist.genres && artist.genres.length > 0 && (
                        <Flex gap={2} mt={2} flexWrap="wrap">
                          {artist.genres.map((genre) => (
                            <Badge
                              key={genre}
                              colorScheme="gray"
                              bg="gray.700"
                              color="gray.100"
                              borderRadius="full"
                              border="1px"
                              borderColor="gray.600"
                              px={2}
                              py={0.5}
                              fontSize="x-small"
                              letterSpacing="wider"
                            >
                              {genre}
                            </Badge>
                          ))}
                        </Flex>
                      )}
                    </Box>
                  </HStack>
                )}
              </Flex>
            ))}
          </VStack>
        </>
      )}
    </Box>
  );

  const renderMobileArtistsList = () => (
    <Box
      position="absolute"
      top="60px"
      left={0}
      right={0}
      bottom={0}
      bg="gray.900"
      overflowY="auto"
      display="flex"
      flexDirection="column"
    >
      <Box
        bg="gray.900"
        px={4}
        py={2}
        borderBottom="1px"
        borderColor="gray.700"
        position="sticky"
        top={0}
        zIndex={1}
      >
        {/* <Text fontSize="sm" color="gray.400" mb={1} letterSpacing="wider">
          STYLE
        </Text>
        <Select
          mb={4}
          value={selectedStyle}
          onChange={handleStyleChange}
          bg="gray.800"
          color="gray.100"
          borderColor="gray.700"
          _hover={{ borderColor: "gray.600" }}
          _focus={{ borderColor: "purple.500", boxShadow: "none" }}
          fontSize="md"
        >
          <option value="all">ALL STYLES</option>
          <option value="j-rap">J-RAP</option>
          <option value="j-pop">J-POP</option>
          <option value="j-r&b">J-R&B</option>
          <option value="reggae">REGGAE</option>
          <option value="hip hop">HIPHOP</option>
          <option value="thai hip hop">THAI HIP HOP</option>
          <option value="experimental hip hop">EXPERIMENTAL HIP HOP</option>
          <option value="k-rap">K-RAP</option>
          <option value="japanese indie">JAPANESE INDIE</option>
          <option value="shibuya-kei">SHIPBUYA KEI</option>
          <option value="hyperpop">HYPERPOP</option>
          <option value="breakcore">BREAKCORE</option>
          <option value="jam band">JAM BAND</option>
          <option value="city pop">CITY POP</option>
        </Select>
        <Text fontSize="sm" color="gray.400" mb={1} letterSpacing="wider">
          SORT BY
        </Text>
        <Select
          mb={4}
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
              {opt.label === "名前順" ? "NAME" : "PREFECTURE"}
            </option>
          ))}
        </Select> */}
        <InputGroup w="100%" my={4}>
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            bg="gray.800"
            color="white"
            borderColor="gray.700"
            _hover={{ borderColor: "gray.600" }}
            _focus={{ borderColor: "purple.500", boxShadow: "none" }}
            _placeholder={{ color: "gray.400" }}
            fontFamily="Noto Sans JP"
            fontSize="sm"
          />
          <InputRightElement>
            <IconButton
              aria-label="検索"
              icon={<SearchIcon />}
              size="sm"
              variant="ghost"
              color="gray.400"
              _hover={{ color: "white", bg: "gray.700" }}
              onClick={handleSearch}
            />
          </InputRightElement>
        </InputGroup>
        {/* アーティスト数 */}
        <Text fontSize="sm" color="gray.300" mb={1} letterSpacing="wider">
          {artists.length} ARTISTS
        </Text>
      </Box>
      {/* スクロール可能なアーティストリスト */}
      <Box flex="1" overflowY="auto" p={3}>
        <VStack spacing={4} align="stretch" mb="120px" mt={2}>
          {artists.map((artist) => (
            <Flex
              key={artist.name}
              p={4}
              bg={selectedArtist === artist.name ? "yellow.400" : "gray.800"}
              color="white"
              borderRadius="lg"
              align="center"
              gap={4}
              boxShadow="sm"
              cursor="pointer"
              _hover={{
                bg: selectedArtist === artist.name ? "yellow.400" : "gray.700",
                transform: "translateY(-2px)",
                transition: "all 0.2s",
              }}
              onClick={() => handleArtistClick(artist)}
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
                  <Text
                    fontWeight="bold"
                    fontSize="md"
                    mb={1}
                    letterSpacing="wider"
                  >
                    {artist.name}
                  </Text>
                  <Flex align="center" gap={2} fontSize="smaller">
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
                          borderRadius="full"
                          px={2}
                          py={0.5}
                          fontSize="x-small"
                          letterSpacing="wider"
                          border="1px"
                          borderColor="gray.600"
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
      </Box>
    </Box>
  );

  const handleShare = (platform: string, artistName?: string) => {
    const url = window.location.href;
    const title = "HIPHOP ROOTS - 世界のラップを地図で聴く";
    const hashtags = `#HIPHOP #ラップ #HipHopRoots`;
    const text = artistName
      ? `${artistName}の音楽をHIPHOP ROOTSでチェックしよう！`
      : "HIPHOP ROOTSで世界のラップを地図で聴こう！";
    const tweetText = `${text} ${hashtags}`;

    switch (platform) {
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            tweetText
          )}&url=${encodeURIComponent(url)}`,
          "_blank"
        );
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            url
          )}`,
          "_blank"
        );
        break;
      case "line":
        window.open(
          `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
            url
          )}`,
          "_blank"
        );
        break;
    }
  };

  const renderAboutSection = () => (
    <Box
      position="absolute"
      top="60px"
      left={0}
      right={0}
      bottom={0}
      bg="gray.900"
      zIndex={900}
      p={6}
      overflowY="auto"
    >
      <VStack
        spacing={8}
        align="stretch"
        maxW="800px"
        mx="auto"
        mb={{ base: "150px", md: "0" }}
      >
        <Box
          p={6}
          borderRadius="xl"
          bg="gray.800"
          border="1px"
          borderColor="gray.700"
          _hover={{ transform: "translateY(-2px)", transition: "all 0.2s" }}
          transition="all 0.2s"
        >
          <HStack spacing={4} mb={4}>
            <FaInfoCircle size={24} color="#FDD835" />
            <Text fontSize="2xl" fontWeight="bold" color="yellow.400">
              About
            </Text>
          </HStack>
          <Text color="gray.300" fontSize="sm" lineHeight="tall">
            HIPHOP
            ROOTSは、ヒップホップカルチャーを形作ってきたアーティストたちの出身地や育った場所を世界地図上にプロットしたサービスです。
            街、地区、国——場所には物語がある。音楽と土地のつながりを感じ、ヒップホップの多様なルーツに触れてください。
          </Text>
          {/* <Text
            mt={4}
            color="gray.300"
            fontFamily="sans-serif"
            fontSize="sm"
            lineHeight="tall"
          >
            HIPHOP ROOTS is a service that plots the hometowns and places where
            hip-hop artists grew up on a world map, highlighting the roots that
            have shaped hip-hop culture. Cities, neighborhoods, countries—every
            place has its story. Feel the connection between music and place,
            and discover the diverse roots of hip-hop.
          </Text> */}
        </Box>

        <Box
          p={6}
          borderRadius="xl"
          bg="gray.800"
          border="1px"
          borderColor="gray.700"
          _hover={{ transform: "translateY(-2px)", transition: "all 0.2s" }}
          transition="all 0.2s"
        >
          <HStack spacing={4} mb={4}>
            <FaMap size={24} color="#FDD835" />
            <Text fontSize="2xl" fontWeight="bold" color="yellow.400">
              Map
            </Text>
          </HStack>
          <Text color="gray.300" fontSize="sm" lineHeight="tall">
            アーティストの位置情報は、出身地、育った場所、または深い関わりのある場所をもとに設定しています。マップ上の位置はおおよその目安であり、実際の場所とは多少のずれがある場合があります。もし誤りや気になる点があれば、お知らせいただけると幸いです。
          </Text>
          {/* <Text
            mt={4}
            color="gray.300"
            fontFamily="sans-serif"
            fontSize="sm"
            lineHeight="tall"
          >
            The location of each artist on the map is based on their hometown,
            the place they grew up, or a location with which they have a deep
            connection. The map markers are approximate and may not precisely
            reflect the actual location. If you notice any errors or have
            concerns, we would greatly appreciate it if you let us know.
          </Text> */}
        </Box>

        <Box
          p={6}
          borderRadius="xl"
          bg="gray.800"
          border="1px"
          borderColor="gray.700"
          _hover={{ transform: "translateY(-2px)", transition: "all 0.2s" }}
          transition="all 0.2s"
        >
          <HStack spacing={4} mb={4}>
            <FaUsers size={24} color="#FDD835" />
            <Text fontSize="2xl" fontWeight="bold" color="yellow.400">
              Credits
            </Text>
          </HStack>
          <VStack
            align="stretch"
            spacing={2}
            fontFamily="sans-serif"
            fontSize="sm"
          >
            <HStack>
              <Text color="gray.300" fontSize="sm">
                This project is developed by{" "}
                <Link
                  href="https://x.com/hina_gon_81"
                  color="yellow.400"
                  _hover={{ textDecoration: "underline" }}
                  isExternal
                >
                  Hinako
                </Link>
                .
              </Text>
            </HStack>
            <HStack>
              <Text color="gray.300" fontSize="sm">
                Big thanks to{" "}
                <Link
                  href="https://rapworldmap.com/"
                  color="yellow.400"
                  _hover={{ textDecoration: "underline" }}
                  isExternal
                >
                  Rap World Map
                </Link>{" "}
                for some artists data.
              </Text>
            </HStack>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );

  const renderContactSection = () => (
    <Box
      position="absolute"
      top="60px"
      left={0}
      right={0}
      bottom={0}
      bg="gray.900"
      zIndex={900}
      p={6}
      overflowY="auto"
    >
      <VStack
        spacing={8}
        align="stretch"
        maxW="800px"
        mx="auto"
        mb={{ base: "70px", md: "0" }}
      >
        <ContactForm />
      </VStack>
    </Box>
  );

  // PC用アーティスト詳細Boxの位置管理
  const [detailBoxPos, setDetailBoxPos] = useState({
    top: window.innerHeight - 400,
    left: window.innerWidth - 480,
  });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleDetailBoxMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragOffset.current = {
      x: e.clientX - detailBoxPos.left,
      y: e.clientY - detailBoxPos.top,
    };
    document.body.style.userSelect = "none";
  };
  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      setDetailBoxPos((pos) => ({
        left: Math.min(
          Math.max(e.clientX - dragOffset.current.x, 0),
          window.innerWidth - 420
        ),
        top: Math.min(
          Math.max(e.clientY - dragOffset.current.y, 0),
          window.innerHeight - 350
        ),
      }));
    };
    const handleMouseUp = () => {
      setDragging(false);
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  // 画面リサイズ時に詳細ボックスが画面内に収まるよう補正
  useEffect(() => {
    const handleResize = () => {
      setDetailBoxPos((pos) => ({
        left: Math.min(pos.left, window.innerWidth - 420),
        top: Math.min(pos.top, window.innerHeight - 350),
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <Box h="100vh" w="100vw" bg="gray.900">
      {/* Header */}
      <Box
        as="header"
        h="60px"
        w="100%"
        bg="black"
        px={4}
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
            fontSize={{ base: "2xl", md: "3xl" }}
            fontWeight="bold"
            color="white"
            letterSpacing="wider"
            textTransform="uppercase"
          >
            <span
              style={{
                color: "#FDD835",
                fontWeight: "bold",
                letterSpacing: "wider",
              }}
            >
              HIPHOP ROOTS
            </span>
          </Text>
          <Box>
            <HStack spacing={2} display={{ base: "none", md: "flex" }}>
              <Button
                variant="ghost"
                color="gray.400"
                _hover={{ color: "yellow.400", bg: "gray.700" }}
                onClick={() => {
                  setShowAbout(false);
                  setShowContact(false);
                }}
                letterSpacing="wider"
                display={{
                  base: "none",
                  md: "flex",
                }}
              >
                MAP
              </Button>
              <Button
                variant="ghost"
                color="gray.400"
                _hover={{ color: "yellow.400", bg: "gray.700" }}
                onClick={() => {
                  setShowAbout(true);
                  setShowContact(false);
                }}
                letterSpacing="wider"
                display={{
                  base: "none",
                  md: "flex",
                }}
              >
                About
              </Button>
              <Button
                variant="ghost"
                color="gray.400"
                _hover={{ color: "yellow.400", bg: "gray.700" }}
                onClick={() => {
                  setShowContact(true);
                  setShowAbout(false);
                }}
                letterSpacing="wider"
                display={{
                  base: "none",
                  md: "flex",
                }}
              >
                Contact
              </Button>
            </HStack>
            {isMobile && (
              <IconButton
                aria-label="Menu"
                icon={<HamburgerIcon boxSize={6} />}
                variant="ghost"
                color="gray.400"
                _hover={{ color: "yellow.400", bg: "gray.700" }}
                onClick={onOpen}
                ml={2}
              />
            )}
          </Box>
        </Flex>
      </Box>

      <Flex
        h={{ base: "calc(100vh - 60px - 60px)", md: "calc(100vh - 60px)" }}
        w="100vw"
      >
        {/* About Section */}
        {showAbout && renderAboutSection()}
        {/* Contact Section */}
        {showContact && renderContactSection()}
        {/* Mobile Artists List */}
        {isMobile && activeTab === "artists" && renderMobileArtistsList()}

        {/* Sidebar for desktop */}
        {!isMobile && !showAbout && !showContact && (
          <Flex position="relative">
            <IconButton
              aria-label="Toggle sidebar"
              icon={isSidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
              position="absolute"
              top={2}
              right={-10}
              size="sm"
              variant="ghost"
              color="gray.400"
              border="1px"
              borderColor="gray.700"
              bg="gray.800"
              _hover={{ color: "white", bg: "gray.700" }}
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              display={{ base: "none", md: "flex" }}
              zIndex={999}
            />
            {renderSidebar()}
          </Flex>
        )}

        {/* Map */}
        <Box
          flex="1"
          position="relative"
          display={{
            base:
              activeTab === "map" && !showAbout && !showContact
                ? "block"
                : "none",
            md: showAbout || showContact ? "none" : "block",
          }}
        >
          <MapContainer
            center={[35.6895, 139.6917]}
            zoom={5}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
            ref={mapRef}
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
                disableClusteringAtZoom={12}
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
                          click: () => handleArtistClick(artist),
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
          {/* PC用: 右下固定（ドラッグ可能） */}
          {!isMobile && hoveredArtist && (
            <Box
              position="fixed"
              top={detailBoxPos.top}
              left={detailBoxPos.left}
              p={6}
              borderRadius="xl"
              boxShadow="2xl"
              w="420px"
              zIndex={1000}
              border="1px"
              borderColor="gray.700"
              backdropFilter="blur(10px)"
              bg="rgba(26, 32, 44, 0.95)"
              overflowY="auto"
              style={{
                cursor: dragging ? "grabbing" : "grab",
                transition: dragging ? "none" : "box-shadow 0.2s",
              }}
              onMouseDown={handleDetailBoxMouseDown}
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
              <Flex align="center" gap={4} mb={4} w="100%">
                <Box w="100%">
                  <HStack justify="space-between" w="100%">
                    <HStack alignItems="center" spacing={5}>
                      <Text
                        fontWeight="bold"
                        color="yellow.400"
                        fontSize="xl"
                        mb={1}
                        alignSelf="center"
                      >
                        {hoveredArtist.name}
                      </Text>
                      <Flex align="center" gap={1} color="gray.400">
                        <FaMapMarkerAlt />
                        <Text fontSize="small">{hoveredArtist.city}</Text>
                      </Flex>
                    </HStack>
                  </HStack>
                  {hoveredArtist.genres && hoveredArtist.genres.length > 0 && (
                    <Box mt={2}>
                      <Flex gap={2} flexWrap="wrap">
                        {hoveredArtist.genres.map((genre) => (
                          <Badge
                            key={genre}
                            colorScheme="gray"
                            bg="gray.700"
                            color="gray.100"
                            borderRadius="full"
                            border="1px"
                            borderColor="gray.600"
                            px={2}
                            py={0.5}
                            fontSize="x-small"
                          >
                            {genre}
                          </Badge>
                        ))}
                      </Flex>
                    </Box>
                  )}
                </Box>
              </Flex>
              {/* Spotify Player */}
              {hoveredArtist.spotifyTrackId && (
                <Box mt={4}>
                  <SpotifyEmbed trackId={hoveredArtist.spotifyTrackId} />
                </Box>
              )}
              {hoveredArtist.youtubeUrl && (
                <Box mt={4}>
                  <Text
                    fontSize="sm"
                    color="gray.400"
                    mb={2}
                    fontWeight="bold"
                    letterSpacing="wider"
                  >
                    YOUTUBE
                  </Text>
                  <YouTubeEmbed videoId={hoveredArtist.youtubeUrl} />
                </Box>
              )}
              {(hoveredArtist.instagramUrl ||
                hoveredArtist.twitterUrl ||
                hoveredArtist.facebookUrl ||
                hoveredArtist.youtubeChannelUrl ||
                hoveredArtist.tiktokUrl) && (
                <Box mt={5}>
                  <Text
                    fontSize="sm"
                    color="gray.400"
                    mb={1}
                    fontWeight="bold"
                    letterSpacing="wider"
                  >
                    SOCIAL MEDIA
                  </Text>
                  <Flex gap={3}>
                    {hoveredArtist.instagramUrl && (
                      <IconButton
                        as="a"
                        href={hoveredArtist.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                        icon={<FaInstagram size={25} />}
                        size="md"
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
                        icon={<FaTwitter size={25} />}
                        size="md"
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
                        icon={<FaFacebook size={25} />}
                        size="md"
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
                        icon={<FaYoutube size={25} />}
                        size="md"
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
                        icon={<FaTiktok size={25} />}
                        size="md"
                        variant="ghost"
                        color="gray.400"
                        _hover={{ color: "#000000", bg: "gray.700" }}
                      />
                    )}
                  </Flex>
                </Box>
              )}
              <Button
                leftIcon={<FaShareAlt size={13} />}
                size="sm"
                variant="ghost"
                border="1px"
                borderColor="gray.700"
                p={2}
                borderRadius="md"
                bg="gray.700"
                color="gray.100"
                _hover={{ color: "#1DA1F2", bg: "gray.700" }}
                onClick={() => handleShare("twitter", hoveredArtist.name)}
                fontSize="smaller"
                mr={6}
                position="absolute"
                bottom={7}
                right={0}
                zIndex={1000}
              >
                Share
              </Button>
            </Box>
          )}

          {/* SP用: 下からDrawerで詳細表示 */}
          {isMobile && hoveredArtist && (
            <Drawer
              isOpen={!!hoveredArtist}
              placement="bottom"
              onClose={() => setHoveredArtist(null)}
              size="full"
            >
              <DrawerOverlay />
              <DrawerContent
                ref={drawerRef}
                bg="gray.900"
                color="white"
                borderTopRadius="2xl"
                maxHeight="395px"
                mt="auto"
                mb="0"
                position="absolute"
                left={0}
                right={0}
                bottom={0}
                style={{
                  transition: "max-height 0.3s, opacity 0.3s",
                  boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
                }}
                display="flex"
                flexDirection="column"
                justifyContent="flex-end"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* ドラッグインジケーターバー */}
                <Box
                  w="100%"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  pt={3}
                >
                  <Box w="40px" h="5px" bg="gray.500" borderRadius="full" />
                </Box>
                <DrawerCloseButton color="gray.400" top={3} right={3} />
                <DrawerBody p={6} overflowY="auto">
                  <Flex align="center" gap={4} mb={4} w="100%">
                    <Box w="100%">
                      <HStack justify="space-between" w="100%">
                        <HStack alignItems="center" spacing={5}>
                          <Text
                            fontWeight="bold"
                            color="yellow.400"
                            fontSize="xl"
                            mb={1}
                            alignSelf="center"
                          >
                            {hoveredArtist.name}
                          </Text>
                          <Flex align="center" gap={1} color="gray.400">
                            <FaMapMarkerAlt />
                            <Text fontSize="small">{hoveredArtist.city}</Text>
                          </Flex>
                        </HStack>
                      </HStack>
                      {hoveredArtist.genres &&
                        hoveredArtist.genres.length > 0 && (
                          <Box mt={2}>
                            <Flex gap={2} flexWrap="wrap">
                              {hoveredArtist.genres.map((genre) => (
                                <Badge
                                  key={genre}
                                  colorScheme="gray"
                                  bg="gray.700"
                                  color="gray.100"
                                  borderRadius="full"
                                  border="1px"
                                  borderColor="gray.600"
                                  px={2}
                                  py={0.5}
                                  fontSize="xs"
                                  letterSpacing="wider"
                                >
                                  {genre}
                                </Badge>
                              ))}
                            </Flex>
                          </Box>
                        )}
                    </Box>
                  </Flex>
                  {/* Spotify Player */}
                  {hoveredArtist.spotifyTrackId && (
                    <Box mt={4}>
                      <SpotifyEmbed trackId={hoveredArtist.spotifyTrackId} />
                    </Box>
                  )}
                  {hoveredArtist.youtubeUrl && (
                    <Box mt={4}>
                      <Text
                        fontSize="sm"
                        color="gray.400"
                        mb={2}
                        fontWeight="bold"
                        letterSpacing="wider"
                      >
                        YOUTUBE
                      </Text>
                      <YouTubeEmbed videoId={hoveredArtist.youtubeUrl} />
                    </Box>
                  )}
                  {(hoveredArtist.instagramUrl ||
                    hoveredArtist.twitterUrl ||
                    hoveredArtist.facebookUrl ||
                    hoveredArtist.youtubeChannelUrl ||
                    hoveredArtist.tiktokUrl) && (
                    <Box mt={7}>
                      <Text
                        fontSize="sm"
                        color="gray.400"
                        mb={1}
                        fontWeight="bold"
                        letterSpacing="wider"
                      >
                        SOCIAL MEDIA
                      </Text>
                      <Flex gap={3}>
                        {hoveredArtist.instagramUrl && (
                          <IconButton
                            as="a"
                            href={hoveredArtist.instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Instagram"
                            icon={<FaInstagram size={25} />}
                            size="md"
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
                            icon={<FaTwitter size={25} />}
                            size="md"
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
                            icon={<FaFacebook size={25} />}
                            size="md"
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
                            icon={<FaYoutube size={25} />}
                            size="md"
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
                            icon={<FaTiktok size={25} />}
                            size="md"
                            variant="ghost"
                            color="gray.400"
                            _hover={{ color: "#000000", bg: "gray.700" }}
                          />
                        )}
                      </Flex>
                    </Box>
                  )}
                  <Button
                    leftIcon={<FaShareAlt size={13} />}
                    size="sm"
                    variant="ghost"
                    border="1px"
                    borderColor="gray.700"
                    p={2}
                    borderRadius="md"
                    bg="gray.700"
                    color="gray.100"
                    _hover={{ color: "#1DA1F2", bg: "gray.700" }}
                    onClick={() => handleShare("twitter", hoveredArtist.name)}
                    fontSize="smaller"
                    mr={6}
                    position="absolute"
                    bottom={10}
                    right={0}
                    zIndex={1000}
                  >
                    Share
                  </Button>
                </DrawerBody>
              </DrawerContent>
            </Drawer>
          )}
        </Box>

        {/* Mobile Menu Drawer */}
        <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xs">
          <DrawerOverlay />
          <DrawerContent bg="gray.900" color="white" maxW="200px">
            <DrawerCloseButton color="gray.400" />
            <DrawerHeader borderBottomWidth="1px" borderColor="gray.700">
              MENU
            </DrawerHeader>
            <DrawerBody>
              <VStack justify="space-between" h="100%" mt={6}>
                <VStack spacing={6} alignItems="flex-start" w="100%">
                  <Box>
                    <Text
                      fontSize="lg"
                      fontWeight="bold"
                      mb={1}
                      letterSpacing="wider"
                      cursor="pointer"
                      onClick={() => {
                        setShowAbout(true);
                        setShowContact(false);
                        onClose();
                      }}
                    >
                      ABOUT
                    </Text>
                  </Box>
                  <Box>
                    <Text
                      fontSize="lg"
                      fontWeight="bold"
                      mb={1}
                      letterSpacing="wider"
                      cursor="pointer"
                      onClick={() => {
                        setShowContact(true);
                        setShowAbout(false);
                        onClose();
                      }}
                    >
                      CONTACT
                    </Text>
                  </Box>
                  <Box>
                    <Text
                      fontSize="lg"
                      fontWeight="bold"
                      mb={3}
                      letterSpacing="wider"
                    >
                      SHARE
                    </Text>
                    <VStack alignItems="flex-start">
                      <Button
                        leftIcon={<FaTwitter size={20} />}
                        size="md"
                        variant="ghost"
                        color="gray.400"
                        _hover={{ color: "#1DA1F2", bg: "gray.700" }}
                        onClick={() => handleShare("twitter")}
                      >
                        Twitter
                      </Button>
                      <Button
                        leftIcon={<FaFacebook size={20} />}
                        size="md"
                        variant="ghost"
                        color="gray.400"
                        _hover={{ color: "#4267B2", bg: "gray.700" }}
                        onClick={() => handleShare("facebook")}
                      >
                        Facebook
                      </Button>
                    </VStack>
                  </Box>
                </VStack>
                <Box mb={10} w="100%">
                  <Divider w="100%" />
                  <Box mt={3} w="100%" textAlign="center">
                    <Text fontSize="sm" color="gray.400">
                      HIPHOP ROOTS
                    </Text>
                  </Box>
                </Box>
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Mobile Navigation */}
        {isMobile && renderMobileNav()}
      </Flex>
    </Box>
  );
}
