export default function Certificate({ document }) {
  return (
    <div className="p-4  max-w-5xl min-w-4xl ml-auto mr-auto shadow-md shadow-gray-300">
      <div>Good job, you are successfully connected to DC_2026_A</div>
      <div>The document context is</div>
      <pre className="overflow-x-auto whitespace-pre-wrap bg-amber-100 py-3 px-6">{JSON.stringify(document, null, 2)}</pre>
    </div>
  );
}
