"use client";

import { useState, useEffect } from "react";
import { Artist } from "@/db/schema";
import Image from "next/image";
import {
  Box,
  Flex,
  Input,
  Text,
  VStack,
  Button,
  HStack,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  Divider,
  IconButton,
  Textarea,
  Stack,
} from "@chakra-ui/react";
import { EditIcon, AddIcon, DeleteIcon } from "@chakra-ui/icons";
import ImageUpload from "@/components/ImageUpload";

const PAGE_SIZE = 25;

// ダミー関数: ステータス・メール・フォロワー数・登録日を生成
function getCreatedAt(index: number) {
  const base = new Date(2023, 0, 1);
  base.setDate(base.getDate() + index * 10);
  return base;
}

// 住所から緯度経度を取得する関数
const getCoordinatesFromAddress = async (address: string) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      const addressComponents = data.results[0].address_components;
      const prefecture = addressComponents.find((component: any) =>
        component.types.includes("administrative_area_level_1")
      )?.long_name;
      return { lat, lng, prefecture };
    }
    return null;
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return null;
  }
};

export default function ArtistsAdminPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editArtist, setEditArtist] = useState<Artist | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [deleteArtist, setDeleteArtist] = useState<Artist | null>(null);
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
  } = useDisclosure();
  const [newArtist, setNewArtist] = useState({
    name: "",
    city: "",
    lat: 0,
    lng: 0,
    genres: [],
    songTitle: "",
    spotifyTrackId: "",
    originalImage: "",
    smallImage: "",
    youtubeUrl: "",
    instagramUrl: "",
    twitterUrl: "",
    facebookUrl: "",
    youtubeChannelUrl: "",
    tiktokUrl: "",
    prefecture: "",
  });

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    try {
      const response = await fetch("/api/artists");

      if (!response.ok) {
        if (response.status === 401) {
          // 認証エラーの場合、ログインページにリダイレクト
          window.location.href = "/admin/login";
          return;
        }
        throw new Error(
          `サーバーエラー (${response.status}): ${response.statusText}`
        );
      }

      const data = await response.json();
      setArtists(data);
    } catch (error) {
      console.error("アーティストデータの読み込みエラー:", error);
      // エラーの場合は空配列を設定
      setArtists([]);
    }
  };

  // 検索
  const filteredArtists = artists.filter((artist) =>
    artist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ページネーション
  const totalPages = Math.ceil(filteredArtists.length / PAGE_SIZE);
  const paginatedArtists = filteredArtists.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const cardBg = useColorModeValue("white", "gray.700");
  const cardShadow = useColorModeValue("md", "dark-lg");

  const handleEditClick = (artist: Artist, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditArtist(artist);
    setSelectedArtist(artist);
    setIsEditMode(true);
    onOpen();
  };

  const handleCardClick = (artist: Artist) => {
    setSelectedArtist(artist);
    setIsEditMode(false);
    onOpen();
  };

  const handleEditChange = (field: keyof Artist, value: any) => {
    if (!editArtist) return;
    setEditArtist({ ...editArtist, [field]: value });
  };

  const handleGenresChange = (value: string) => {
    if (!editArtist) return;
    setEditArtist({
      ...editArtist,
      genres: value.split(",").map((g) => g.trim()),
    });
  };

  const handleSave = async () => {
    if (!editArtist) return;

    try {
      const response = await fetch("/api/artists", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editArtist),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error(
          `保存に失敗しました (${response.status}): ${response.statusText}`
        );
      }

      setIsEditMode(false);
      onClose();
      setEditArtist(null);
      loadArtists();
    } catch (error) {
      console.error("保存エラー:", error);
      alert(
        "保存に失敗しました: " +
          (error instanceof Error ? error.message : "不明なエラー")
      );
    }
  };

  const handleCityChange = (value: string, isEdit: boolean = false) => {
    if (isEdit && editArtist) {
      setEditArtist({ ...editArtist, city: value });
    } else {
      setNewArtist({ ...newArtist, city: value });
    }
  };

  const handleFetchCoordinates = async (isEdit: boolean = false) => {
    const address = isEdit ? editArtist?.city : newArtist.city;
    if (!address) return;

    const coordinates = await getCoordinatesFromAddress(address);
    if (coordinates) {
      if (isEdit && editArtist) {
        setEditArtist({
          ...editArtist,
          lat: coordinates.lat,
          lng: coordinates.lng,
          prefecture: coordinates.prefecture,
        });
      } else {
        setNewArtist({
          ...newArtist,
          lat: coordinates.lat,
          lng: coordinates.lng,
          prefecture: coordinates.prefecture,
        });
      }
    }
  };

  const handleNewArtistChange = (field: string, value: any) => {
    if (field === "genres") {
      setNewArtist({
        ...newArtist,
        genres: value.split(",").map((g: string) => g.trim()),
      });
    } else if (field === "lat" || field === "lng") {
      setNewArtist({ ...newArtist, [field]: parseFloat(value) });
    } else {
      setNewArtist({ ...newArtist, [field]: value });
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch("/api/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newArtist),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error(
          `作成に失敗しました (${response.status}): ${response.statusText}`
        );
      }

      setIsCreateMode(false);
      setNewArtist({
        name: "",
        city: "",
        lat: 0,
        lng: 0,
        genres: [],
        songTitle: "",
        spotifyTrackId: "",
        originalImage: "",
        smallImage: "",
        youtubeUrl: "",
        instagramUrl: "",
        twitterUrl: "",
        facebookUrl: "",
        youtubeChannelUrl: "",
        tiktokUrl: "",
        prefecture: "",
      });
      loadArtists();
    } catch (error) {
      console.error("作成エラー:", error);
      alert(
        "作成に失敗しました: " +
          (error instanceof Error ? error.message : "不明なエラー")
      );
    }
  };

  const handleDeleteClick = (artist: Artist, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteArtist(artist);
    onDeleteModalOpen();
  };

  const handleDelete = async () => {
    if (!deleteArtist) return;

    try {
      const response = await fetch("/api/artists", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteArtist.id }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error(
          `削除に失敗しました (${response.status}): ${response.statusText}`
        );
      }

      onDeleteModalClose();
      setDeleteArtist(null);
      loadArtists();
    } catch (error) {
      console.error("削除エラー:", error);
      alert(
        "削除に失敗しました: " +
          (error instanceof Error ? error.message : "不明なエラー")
      );
    }
  };

  return (
    <Box maxW="900px" mx="auto" p={4}>
      {/* 検索 */}
      <Flex mb={4} gap={2}>
        <Input
          placeholder="アーティスト名で検索..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
      </Flex>

      {/* アーティスト一覧 */}
      <Box as={VStack} spacing={4} maxH="600px" overflowY="auto">
        {paginatedArtists.map((artist, idx) => (
          <Box key={artist.id} w="100%" position="relative">
            <HStack
              position="absolute"
              top={2}
              right={2}
              zIndex={2}
              spacing={2}
            >
              <IconButton
                aria-label="編集"
                icon={<EditIcon />}
                size="sm"
                variant="ghost"
                onClick={(e) => handleEditClick(artist, e)}
              />
              <IconButton
                aria-label="削除"
                icon={<DeleteIcon />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={(e) => handleDeleteClick(artist, e)}
              />
            </HStack>
            <Flex
              align="center"
              bg={cardBg}
              boxShadow={cardShadow}
              borderRadius="xl"
              px={6}
              py={4}
              w="100%"
              _hover={{ boxShadow: "xl", cursor: "pointer", bg: "gray.50" }}
              transition="box-shadow 0.2s"
              onClick={() => handleCardClick(artist)}
            >
              {/* 画像 */}
              <Box
                w="56px"
                h="56px"
                borderRadius="full"
                bg="gray.100"
                overflow="hidden"
                flexShrink={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {artist.smallImage ? (
                  <Image
                    src={artist.smallImage}
                    alt={artist.name}
                    width={56}
                    height={56}
                    style={{
                      objectFit: "cover",
                      width: "100%",
                      height: "100%",
                    }}
                  />
                ) : (
                  <Text color="gray.400" fontSize="2xl">
                    🎤
                  </Text>
                )}
              </Box>
              {/* 情報 */}
              <Flex
                flex="1"
                ml={6}
                direction={{ base: "column", md: "row" }}
                align={{ md: "center" }}
                gap={2}
              >
                <Text fontWeight="bold" fontSize="lg">
                  {artist.name}
                </Text>
                <HStack
                  spacing={2}
                  color="gray.500"
                  fontSize="sm"
                  flexWrap="wrap"
                >
                  <Text>{artist.genres?.join(", ")}</Text>
                </HStack>
              </Flex>
            </Flex>
          </Box>
        ))}
      </Box>

      {/* ページネーション */}
      <Flex justify="center" mt={4} gap={2}>
        <Button
          size="sm"
          onClick={() => setCurrentPage((p) => p - 1)}
          isDisabled={currentPage === 1}
        >
          前へ
        </Button>
        {Array.from({ length: totalPages }).map((_, i) => (
          <Button
            key={i}
            size="sm"
            variant={currentPage === i + 1 ? "solid" : "outline"}
            colorScheme={currentPage === i + 1 ? "blackAlpha" : "gray"}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </Button>
        ))}
        <Button
          size="sm"
          onClick={() => setCurrentPage((p) => p + 1)}
          isDisabled={currentPage === totalPages}
        >
          次へ
        </Button>
      </Flex>

      {/* 詳細・編集モーダル */}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setIsEditMode(false);
          setEditArtist(null);
        }}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isEditMode ? "アーティスト編集" : selectedArtist?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody fontFamily="Noto Sans JP">
            {isEditMode && editArtist ? (
              <Stack
                spacing={3}
                as="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
              >
                <Input
                  placeholder="アーティスト名"
                  value={editArtist.name}
                  onChange={(e) => handleEditChange("name", e.target.value)}
                />
                <HStack>
                  <Input
                    placeholder="市区町村"
                    value={editArtist.city}
                    onChange={(e) => handleCityChange(e.target.value, true)}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleFetchCoordinates(true)}
                  >
                    住所から取得
                  </Button>
                </HStack>
                <Input
                  placeholder="緯度"
                  type="number"
                  value={editArtist.lat}
                  onChange={(e) =>
                    handleEditChange("lat", parseFloat(e.target.value))
                  }
                />
                <Input
                  placeholder="経度"
                  type="number"
                  value={editArtist.lng}
                  onChange={(e) =>
                    handleEditChange("lng", parseFloat(e.target.value))
                  }
                />
                <Input
                  placeholder="ジャンル（カンマ区切り）"
                  value={editArtist.genres?.join(", ")}
                  onChange={(e) => handleGenresChange(e.target.value)}
                />
                <Input
                  placeholder="代表曲"
                  value={editArtist.songTitle}
                  onChange={(e) =>
                    handleEditChange("songTitle", e.target.value)
                  }
                />
                <Input
                  placeholder="SpotifyトラックID"
                  value={editArtist.spotifyTrackId || ""}
                  onChange={(e) =>
                    handleEditChange("spotifyTrackId", e.target.value)
                  }
                />

                {/* 画像アップロード */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    アーティスト画像:
                  </Text>
                  <ImageUpload
                    artistName={editArtist.name}
                    currentOriginalUrl={editArtist.originalImage || ""}
                    currentSmallUrl={editArtist.smallImage || ""}
                    onUploadSuccess={(originalUrl, smallUrl) => {
                      handleEditChange("originalImage", originalUrl);
                      handleEditChange("smallImage", smallUrl);
                    }}
                  />
                </Box>

                {/* 画像URLの手動入力（オプション） */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    または、URLを直接入力:
                  </Text>
                  <Input
                    placeholder="オリジナル画像URL"
                    value={editArtist.originalImage || ""}
                    onChange={(e) =>
                      handleEditChange("originalImage", e.target.value)
                    }
                    mb={2}
                  />
                  <Input
                    placeholder="サムネイル画像URL"
                    value={editArtist.smallImage || ""}
                    onChange={(e) =>
                      handleEditChange("smallImage", e.target.value)
                    }
                  />
                </Box>

                <Input
                  placeholder="YouTube URL"
                  value={editArtist.youtubeUrl || ""}
                  onChange={(e) =>
                    handleEditChange("youtubeUrl", e.target.value)
                  }
                />
                <Input
                  placeholder="Instagram URL"
                  value={editArtist.instagramUrl || ""}
                  onChange={(e) =>
                    handleEditChange("instagramUrl", e.target.value)
                  }
                />
                <Input
                  placeholder="Twitter URL"
                  value={editArtist.twitterUrl || ""}
                  onChange={(e) =>
                    handleEditChange("twitterUrl", e.target.value)
                  }
                />
                <Input
                  placeholder="Facebook URL"
                  value={editArtist.facebookUrl || ""}
                  onChange={(e) =>
                    handleEditChange("facebookUrl", e.target.value)
                  }
                />
                <Input
                  placeholder="YouTubeチャンネルURL"
                  value={editArtist.youtubeChannelUrl || ""}
                  onChange={(e) =>
                    handleEditChange("youtubeChannelUrl", e.target.value)
                  }
                />
                <Input
                  placeholder="TikTok URL"
                  value={editArtist.tiktokUrl || ""}
                  onChange={(e) =>
                    handleEditChange("tiktokUrl", e.target.value)
                  }
                />
                <Input
                  placeholder="都道府県"
                  value={editArtist.prefecture}
                  onChange={(e) =>
                    handleEditChange("prefecture", e.target.value)
                  }
                />
                <Flex gap={2} mt={2}>
                  <Button colorScheme="blue" type="submit">
                    保存
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditMode(false);
                      setEditArtist(null);
                    }}
                  >
                    キャンセル
                  </Button>
                </Flex>
              </Stack>
            ) : (
              selectedArtist && (
                <Box>
                  <Flex align="center" mb={4}>
                    <Box
                      w="80px"
                      h="80px"
                      borderRadius="full"
                      bg="gray.100"
                      overflow="hidden"
                      flexShrink={0}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {selectedArtist.smallImage ? (
                        <Image
                          src={selectedArtist.smallImage}
                          alt={selectedArtist.name}
                          width={80}
                          height={80}
                          style={{
                            objectFit: "cover",
                            width: "100%",
                            height: "100%",
                          }}
                        />
                      ) : (
                        <Text color="gray.400" fontSize="3xl">
                          🎤
                        </Text>
                      )}
                    </Box>
                    <Box ml={6}>
                      <Text fontWeight="bold" fontSize="xl">
                        {selectedArtist.name}
                      </Text>
                      <Text color="gray.500">
                        {selectedArtist.genres?.join(", ")}
                      </Text>
                    </Box>
                  </Flex>
                  <Divider my={2} />
                  <Text fontSize="sm" color="gray.600">
                    <b>市区町村:</b> {selectedArtist.city}
                    <br />
                    <b>緯度:</b> {selectedArtist.lat}
                    <br />
                    <b>経度:</b> {selectedArtist.lng}
                    <br />
                    <b>ジャンル:</b> {selectedArtist.genres?.join(", ")}
                    <br />
                    <b>代表曲:</b> {selectedArtist.songTitle}
                    <br />
                    <b>SpotifyトラックID:</b>{" "}
                    {selectedArtist.spotifyTrackId || "なし"}
                    <br />
                    <b>オリジナル画像URL:</b>{" "}
                    {selectedArtist.originalImage || "なし"}
                    <br />
                    <b>サムネイル画像URL:</b>{" "}
                    {selectedArtist.smallImage || "なし"}
                    <br />
                    <b>YouTube URL:</b> {selectedArtist.youtubeUrl || "なし"}
                    <br />
                    <b>Instagram URL:</b>{" "}
                    {selectedArtist.instagramUrl || "なし"}
                    <br />
                    <b>Twitter URL:</b> {selectedArtist.twitterUrl || "なし"}
                    <br />
                    <b>Facebook URL:</b> {selectedArtist.facebookUrl || "なし"}
                    <br />
                    <b>YouTubeチャンネルURL:</b>{" "}
                    {selectedArtist.youtubeChannelUrl || "なし"}
                    <br />
                    <b>TikTok URL:</b> {selectedArtist.tiktokUrl || "なし"}
                    <br />
                    <b>都道府県:</b> {selectedArtist.prefecture}
                    <br />
                  </Text>
                  <Button
                    mt={4}
                    leftIcon={<EditIcon />}
                    onClick={() => {
                      setEditArtist(selectedArtist);
                      setIsEditMode(true);
                    }}
                  >
                    編集
                  </Button>
                </Box>
              )
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      <Flex justify="flex-end">
        <Button
          leftIcon={<AddIcon />}
          colorScheme="teal"
          onClick={() => setIsCreateMode(true)}
        >
          新規アーティスト追加
        </Button>
      </Flex>

      {/* 新規作成モーダル */}
      <Modal
        isOpen={isCreateMode}
        onClose={() => setIsCreateMode(false)}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>新規アーティスト追加</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack
              spacing={3}
              as="form"
              onSubmit={(e) => {
                e.preventDefault();
                handleCreate();
              }}
            >
              <Input
                placeholder="アーティスト名"
                value={newArtist.name}
                onChange={(e) => handleNewArtistChange("name", e.target.value)}
              />
              <HStack>
                <Input
                  placeholder="市区町村"
                  value={newArtist.city}
                  onChange={(e) => handleCityChange(e.target.value)}
                />
                <Button size="sm" onClick={() => handleFetchCoordinates()}>
                  住所から取得
                </Button>
              </HStack>
              <Input
                placeholder="緯度"
                type="number"
                value={newArtist.lat}
                onChange={(e) => handleNewArtistChange("lat", e.target.value)}
              />
              <Input
                placeholder="経度"
                type="number"
                value={newArtist.lng}
                onChange={(e) => handleNewArtistChange("lng", e.target.value)}
              />
              <Input
                placeholder="ジャンル（カンマ区切り）"
                value={newArtist.genres.join(", ")}
                onChange={(e) =>
                  handleNewArtistChange("genres", e.target.value)
                }
              />
              <Input
                placeholder="代表曲"
                value={newArtist.songTitle}
                onChange={(e) =>
                  handleNewArtistChange("songTitle", e.target.value)
                }
              />
              <Input
                placeholder="SpotifyトラックID"
                value={newArtist.spotifyTrackId}
                onChange={(e) =>
                  handleNewArtistChange("spotifyTrackId", e.target.value)
                }
              />

              {/* 画像アップロード */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  アーティスト画像:
                </Text>
                <ImageUpload
                  artistName={newArtist.name}
                  currentOriginalUrl={newArtist.originalImage}
                  currentSmallUrl={newArtist.smallImage}
                  onUploadSuccess={(originalUrl, smallUrl) => {
                    handleNewArtistChange("originalImage", originalUrl);
                    handleNewArtistChange("smallImage", smallUrl);
                  }}
                />
              </Box>

              {/* 画像URLの手動入力（オプション） */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  または、URLを直接入力:
                </Text>
                <Input
                  placeholder="オリジナル画像URL"
                  value={newArtist.originalImage}
                  onChange={(e) =>
                    handleNewArtistChange("originalImage", e.target.value)
                  }
                  mb={2}
                />
                <Input
                  placeholder="サムネイル画像URL"
                  value={newArtist.smallImage}
                  onChange={(e) =>
                    handleNewArtistChange("smallImage", e.target.value)
                  }
                />
              </Box>

              <Input
                placeholder="YouTube URL"
                value={newArtist.youtubeUrl}
                onChange={(e) =>
                  handleNewArtistChange("youtubeUrl", e.target.value)
                }
              />
              <Input
                placeholder="Instagram URL"
                value={newArtist.instagramUrl}
                onChange={(e) =>
                  handleNewArtistChange("instagramUrl", e.target.value)
                }
              />
              <Input
                placeholder="Twitter URL"
                value={newArtist.twitterUrl}
                onChange={(e) =>
                  handleNewArtistChange("twitterUrl", e.target.value)
                }
              />
              <Input
                placeholder="Facebook URL"
                value={newArtist.facebookUrl}
                onChange={(e) =>
                  handleNewArtistChange("facebookUrl", e.target.value)
                }
              />
              <Input
                placeholder="YouTubeチャンネルURL"
                value={newArtist.youtubeChannelUrl}
                onChange={(e) =>
                  handleNewArtistChange("youtubeChannelUrl", e.target.value)
                }
              />
              <Input
                placeholder="TikTok URL"
                value={newArtist.tiktokUrl}
                onChange={(e) =>
                  handleNewArtistChange("tiktokUrl", e.target.value)
                }
              />
              <Button type="submit" colorScheme="teal" mt={4}>
                保存
              </Button>
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* 削除確認モーダル */}
      <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>アーティストの削除</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text>
              {deleteArtist?.name}を削除してもよろしいですか？
              この操作は取り消せません。
            </Text>
            <Flex justify="flex-end" mt={4} gap={2}>
              <Button onClick={onDeleteModalClose}>キャンセル</Button>
              <Button colorScheme="red" onClick={handleDelete}>
                削除
              </Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
