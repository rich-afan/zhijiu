export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    message: "Kling API route is working"
  });
}
