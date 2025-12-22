export default function AdminLogs() {
  const kibanaUrl = "http://15.165.112.34:5601/app/r/s/x2Ah6";

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">로그 보기</h1>
        <p className="text-sm text-gray-500">
          Kibana 대시보드를 iframe으로 임베드했습니다. 새 탭에서 보려면 아래
          버튼을 눌러주세요.
        </p>
        <div className="mt-2 flex gap-2">
          <a
            href={kibanaUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 text-sm font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-500"
          >
            새 탭에서 열기
          </a>
        </div>
      </div>
      <div className="border rounded-xl overflow-hidden shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
        <iframe
          title="Kibana Logs"
          src={kibanaUrl}
          className="w-full"
          style={{ minHeight: "80vh" }}
        />
      </div>
    </div>
  );
}
