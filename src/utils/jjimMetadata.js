// Metadata helper for dynamic grouping

/**
 * Parse legacy path like "고1/1학기/수학" -> { grade, semester, subject }
 */
export function parsePathToMetadata(path) {
  if (!path) return { grade: "", semester: "", subject: "" };
  const parts = path.split("/").map((p) => p.trim());
  return {
    grade: parts[0] || "",
    semester: parts[1] || "",
    subject: parts[2] || "",
  };
}

/**
 * One-time migration: ensure metadata exists from legacy folderId/folderPath
 */
export function ensureMetadata(video) {
  if (video.metadata && (video.metadata.grade || video.metadata.semester || video.metadata.subject)) {
    return video;
  }

  // Try legacy path (if any). Here we only know folderId; path was not stored.
  // Fallback: empty metadata.
  // If later you can resolve folderId -> path, plug it here.
  const path = video.folderPath || "";
  const parsed = parsePathToMetadata(path);

  return {
    ...video,
    metadata: {
      grade: parsed.grade || "",
      semester: parsed.semester || "",
      subject: parsed.subject || "",
    },
  };
}

/**
 * Dynamic grouping based on groupingOrder, returns nested tree
 * groupingOrder example: ['grade','subject','semester']
 */
export function buildDynamicTree(items, groupingOrder) {
  if (!groupingOrder || groupingOrder.length === 0) return items;

  const group = (arr, depth = 0) => {
    if (depth >= groupingOrder.length) return { items: arr };
    const key = groupingOrder[depth];
    const buckets = {};
    arr.forEach((item) => {
      const metaVal = item.metadata?.[key] || "미분류";
      if (!buckets[metaVal]) buckets[metaVal] = [];
      buckets[metaVal].push(item);
    });
    const children = Object.entries(buckets).map(([name, list]) => {
      const subtree = group(list, depth + 1);
      return {
        name,
        key,
        children: subtree.children || [],
        items: subtree.items || [],
      };
    });
    return { children };
  };

  return group(items, 0).children || [];
}



