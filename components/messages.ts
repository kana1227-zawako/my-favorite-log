import type { OperationResult } from "@/hooks/useRecords";

/** 保存・削除の結果に応じてモーダル内に表示するエラーメッセージ（成功時は null） */
export function operationErrorMessage(
  result: OperationResult,
  action: "save" | "delete",
): string | null {
  switch (result.status) {
    case "ok":
      return null;
    case "writeError":
      return action === "save"
        ? "保存できませんでした。もう一度お試しください。"
        : "削除できませんでした。もう一度お試しください。";
    case "notFound":
      return "この記録は見つかりませんでした。他の画面で削除された可能性があります。";
    case "corrupt":
      return "保存データが破損しているため、処理を中止しました。データは変更していません。";
    case "readError":
      return "データを読み込めないため、処理を中止しました。データは変更していません。";
    case "blocked":
      return "データを確認できないため、現在は登録・編集・削除ができません。";
  }
}
