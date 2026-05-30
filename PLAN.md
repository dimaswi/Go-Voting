Saya ingin membuat sistem E-Voting berbasis React untuk frontend dan Golang untuk backend.

Sistem ini memiliki 2 area utama:

1. Admin Page
2. Voting Page / Public E-Vote Page

Gunakan arsitektur yang rapi, scalable, modular, dan production-ready.

Frontend:
- React
- TypeScript
- Tailwind CSS
- shadcn/ui untuk seluruh komponen Admin Page
- Gunakan komponen shadcn/ui mulai dari Button, Input, Textarea, Select, Checkbox, Card, Dialog, Table, Sidebar, Sheet, Badge, Tabs, Dropdown, Toast, Form, dan komponen lain yang dibutuhkan.
- Untuk Admin Page gunakan desain dashboard modern, clean, profesional, dan konsisten.
- Jika memungkinkan gunakan struktur seperti starterkit shadcn/ui dashboard.
- Untuk Voting Page gunakan style Neo Brutalism.
- Voting Page harus sangat optimal untuk mobile-first experience.

Backend:
- Golang
- REST API
- Database relational, disarankan PostgreSQL atau MySQL
- Gunakan struktur backend yang clean, misalnya:
  - handler/controller
  - service
  - repository
  - model/entity
  - middleware
  - config
  - migration
- Gunakan JWT untuk login admin.
- Gunakan validasi backend yang kuat.
- Gunakan upload file untuk foto calon.
- Gunakan QR Code generation untuk voter unique ID.

====================================================================
FITUR UTAMA SISTEM
====================================================================

A. ADMIN PAGE

Admin page adalah dashboard untuk mengelola seluruh data E-Voting.

Menu utama Admin Page:

1. Dashboard
2. Event E-Voting
3. Calon / Kandidat
4. User Vote / Voter
5. Assign Calon ke Event
6. Assign User Vote ke Event
7. Hasil Voting
8. Pengaturan Admin

====================================================================
1. DASHBOARD ADMIN
====================================================================

Dashboard menampilkan ringkasan:

- Total event voting
- Total event aktif
- Total calon
- Total voter
- Total voter yang sudah vote
- Total voter yang belum vote
- Grafik jumlah vote per event
- Tabel event terbaru
- Status event:
  - Draft
  - Aktif
  - Selesai
  - Ditutup

Gunakan card statistik dari shadcn/ui.
Gunakan layout dashboard dengan sidebar dan topbar.

====================================================================
2. EVENT E-VOTING
====================================================================

Admin dapat membuat banyak event e-voting.

Field event:

- Nama event
- Deskripsi event
- Tanggal mulai
- Tanggal selesai
- Status event:
  - Draft
  - Aktif
  - Selesai
  - Ditutup
- Maksimal pilihan calon:
  - Contoh: user boleh memilih 1 calon saja
  - Contoh: user boleh memilih maksimal 2 calon
  - Contoh: user boleh memilih maksimal 3 calon
- Minimal pilihan calon
- Apakah voter boleh memilih lebih dari 1 calon
- Apakah hasil voting ditampilkan publik atau hanya admin
- Banner event opsional
- Slug event
- Kode event unik

Rule penting:

- Satu sistem dapat memiliki banyak event voting.
- Setiap event memiliki calon sendiri.
- Setiap event memiliki user vote sendiri.
- Setiap event memiliki aturan jumlah pilihan sendiri.
- Event yang belum aktif tidak bisa digunakan untuk voting.
- Event yang sudah selesai atau ditutup tidak bisa menerima vote.
- Voting hanya bisa dilakukan oleh user vote yang sudah di-assign ke event tersebut.

Fitur pada halaman Event:

- Create event
- Edit event
- Delete event
- Detail event
- Aktifkan event
- Tutup event
- Lihat hasil event
- Assign calon
- Assign voter
- Copy link voting
- Download QR event jika diperlukan

====================================================================
3. CALON / KANDIDAT
====================================================================

Admin dapat membuat data calon selengkap mungkin.

Field calon:

- Nama lengkap
- Nomor urut
- NIK / ID opsional
- Tempat lahir
- Tanggal lahir
- Jenis kelamin
- Alamat
- Nomor HP
- Email
- Foto calon
- Pendidikan
- Pengalaman organisasi
- Jabatan saat ini
- Program kerja
- Visi
- Misi
- Tujuan
- Motto
- Deskripsi lengkap
- Status aktif / tidak aktif

Rule penting:

- Calon dibuat secara global dulu.
- Calon kemudian bisa di-assign ke satu atau banyak event voting.
- Pada event tertentu, calon memiliki nomor urut yang bisa disesuaikan.
- Foto calon harus bisa tampil di Voting Page.
- Visi, misi, program kerja, dan tujuan calon harus tampil detail ketika card calon diklik di Voting Page.

Fitur halaman Calon:

- Tambah calon
- Edit calon
- Delete calon
- Upload foto calon
- Preview foto
- Detail calon
- Search calon
- Filter calon aktif / tidak aktif

====================================================================
4. USER VOTE / VOTER
====================================================================

Admin dapat membuat user vote atau voter.

Field voter:

- Nama lengkap
- NIK / ID peserta opsional
- Nomor HP opsional
- Email opsional
- Instansi / unit / kelas / kelompok opsional
- Unique voter ID
- QR Code voter
- Status:
  - Belum vote
  - Sudah vote
  - Diblokir
- Apakah anonim:
  - Checkbox anonim
  - Jika anonim aktif, maka identitas voter tidak ditampilkan pada hasil publik
  - Namun backend tetap menyimpan voter ID untuk mencegah double vote

Rule penting:

- Setiap voter memiliki unique ID.
- Unique ID harus unik, aman, tidak mudah ditebak, dan bisa dibuat menjadi QR Code.
- QR Code digunakan untuk masuk ke Voting Page.
- Satu voter bisa di-assign ke event tertentu.
- Voter hanya bisa vote satu kali pada satu event.
- Jika event mengizinkan memilih lebih dari satu calon, voter bisa memilih sesuai maksimal pilihan event.
- Jika voter sudah voting, maka tidak bisa voting ulang.
- Jika voter diblokir, maka tidak bisa voting.

Fitur halaman User Vote:

- Tambah voter manual
- Generate unique ID
- Generate QR Code
- Download QR Code
- Download QR Code massal
- Import voter dari Excel/CSV
- Export voter ke Excel/CSV
- Filter voter berdasarkan event
- Filter status sudah vote / belum vote
- Assign voter ke event
- Reset status vote jika admin mengizinkan, tapi harus ada audit log

====================================================================
5. ASSIGN CALON KE EVENT
====================================================================

Pada detail event, admin bisa assign calon.

Fitur:

- Pilih event
- Tampilkan daftar calon yang tersedia
- Checkbox calon yang ingin dimasukkan ke event
- Set nomor urut calon dalam event
- Drag and drop ordering opsional
- Simpan assignment

Rule:

- Satu event bisa memiliki banyak calon.
- Satu calon bisa ikut di lebih dari satu event.
- Calon yang tidak di-assign tidak muncul di Voting Page event tersebut.
- Hanya calon aktif yang bisa dipilih.
- Nomor urut calon harus unik dalam satu event.

====================================================================
6. ASSIGN USER VOTE KE EVENT
====================================================================

Pada detail event, admin bisa assign voter.

Fitur:

- Pilih event
- Tampilkan daftar voter
- Checkbox voter yang ingin dimasukkan ke event
- Import voter langsung ke event
- Generate QR Code untuk voter yang di-assign
- Download QR Code semua voter di event
- Lihat status:
  - Belum vote
  - Sudah vote
  - Diblokir

Rule:

- Voter yang tidak di-assign ke event tidak boleh voting di event tersebut.
- QR Code voter harus mengarah ke Voting Page universal.
- Saat QR Code discan, sistem membaca unique ID voter lalu otomatis mengarahkan ke event voting yang benar.
- Jika voter di-assign ke lebih dari satu event aktif, sistem harus menampilkan pilihan event yang tersedia atau menggunakan aturan prioritas.
- Jika voter hanya di-assign ke satu event aktif, langsung arahkan ke event tersebut.

====================================================================
B. VOTING PAGE / PUBLIC E-VOTE PAGE
====================================================================

Voting Page adalah halaman publik untuk voter.

Gunakan style Neo Brutalism:

- Warna kontras
- Border hitam tebal
- Shadow tegas
- Typography besar dan jelas
- Button besar
- Card kandidat menonjol
- Mobile-first
- UI sederhana, cepat, dan mudah digunakan

Voting Page harus universal.

Flow Voting Page:

1. User membuka halaman voting.
2. Jika belum ada token / unique ID, tampilkan halaman scan barcode.
3. User scan QR Code.
4. QR Code berisi unique voter ID atau secure token.
5. Sistem validasi voter.
6. Sistem cek voter di-assign ke event mana.
7. Jika voter valid dan event aktif, tampilkan halaman event voting.
8. Tampilkan daftar calon yang di-assign ke event tersebut.
9. User memilih calon.
10. Jika event memperbolehkan lebih dari satu pilihan, user bisa memilih lebih dari satu calon sesuai batas maksimal.
11. User klik submit.
12. Tampilkan halaman konfirmasi pilihan.
13. Setelah konfirmasi, vote disimpan.
14. Tampilkan halaman sukses.
15. Jika user sudah vote, tampilkan pesan bahwa voter sudah menggunakan hak pilih.

====================================================================
1. HALAMAN SCAN BARCODE
====================================================================

Halaman awal Voting Page:

- Judul event atau judul umum E-Voting
- Tampilan kamera untuk scan QR Code
- Input manual unique ID sebagai alternatif
- Button validasi
- Pesan error jika QR tidak valid
- Pesan loading saat validasi

Gunakan library QR scanner di frontend.
Pastikan kompatibel dengan mobile browser.

====================================================================
2. HALAMAN EVENT VOTING
====================================================================

Setelah QR Code valid:

Tampilkan:

- Nama event
- Deskripsi event
- Tanggal voting
- Data voter:
  - Nama voter jika tidak anonim
  - Label anonim jika anonim aktif
- Jumlah maksimal pilihan
- Daftar calon

Card calon:

- Foto calon
- Nomor urut
- Nama calon
- Ringkasan visi
- Button lihat detail
- Checkbox / selected state

Rule UI:

- Card calon harus besar dan mudah diklik.
- Ketika card calon diklik, tampilkan modal/drawer detail.
- Detail calon harus berisi:
  - Foto
  - Nama lengkap
  - Nomor urut
  - Visi
  - Misi
  - Program kerja
  - Tujuan
  - Pengalaman
  - Deskripsi lengkap
- User bisa memilih calon dari card.
- Jika sudah mencapai maksimal pilihan, pilihan tambahan harus dicegah.
- Tampilkan counter:
  - “Anda memilih 1 dari maksimal 2 calon”
- Button submit disable jika belum memenuhi minimal pilihan.

====================================================================
3. HALAMAN KONFIRMASI VOTE
====================================================================

Sebelum vote dikirim:

Tampilkan:

- Nama event
- Daftar calon yang dipilih
- Peringatan:
  - “Pilihan tidak dapat diubah setelah dikirim”
- Button:
  - Kembali
  - Konfirmasi Pilihan

Setelah konfirmasi:

- Kirim vote ke backend.
- Backend harus validasi ulang semua rule voting.
- Jika sukses, tampilkan halaman sukses.

====================================================================
4. HALAMAN SUKSES
====================================================================

Tampilkan:

- Icon sukses
- Pesan:
  - “Terima kasih, suara Anda telah berhasil direkam.”
- Informasi event
- Waktu voting
- Status anonim jika aktif
- Jangan tampilkan pilihan jika sistem disetting rahasia.

====================================================================
5. HALAMAN ERROR
====================================================================

Kondisi error:

- QR Code tidak valid
- Voter tidak ditemukan
- Voter belum di-assign ke event
- Event belum aktif
- Event sudah selesai
- Voter sudah voting
- Voter diblokir
- Jumlah pilihan tidak sesuai rule
- Server error

Tampilkan pesan error yang jelas dan user-friendly.

====================================================================
C. HASIL VOTING
====================================================================

Admin dapat melihat hasil voting per event.

Fitur:

- Pilih event
- Tampilkan total suara masuk
- Total voter
- Total voter belum vote
- Persentase partisipasi
- Jumlah suara per calon
- Ranking calon
- Grafik bar / pie
- Export hasil ke Excel/PDF
- Export daftar voter sudah vote
- Export daftar voter belum vote

Rule hasil:

- Sistem harus menghitung vote berdasarkan event.
- Jika satu voter boleh memilih lebih dari satu calon, setiap pilihan dihitung sebagai satu suara untuk calon.
- Identitas voter anonim tidak boleh ditampilkan di hasil publik.
- Admin tetap bisa melihat audit teknis, tapi jangan tampilkan pilihan voter secara eksplisit kecuali memang dibutuhkan.
- Hindari fitur yang membuka kerahasiaan pilihan voter secara sembarangan.

====================================================================
D. DATABASE DESIGN
====================================================================

Buat rancangan database minimal seperti berikut:

1. admins
- id
- name
- email
- password_hash
- role
- created_at
- updated_at

2. voting_events
- id
- name
- slug
- code
- description
- banner_url
- start_at
- end_at
- status
- min_choices
- max_choices
- allow_multiple_choices
- is_result_public
- created_at
- updated_at

3. candidates
- id
- full_name
- candidate_number
- nik
- birth_place
- birth_date
- gender
- address
- phone
- email
- photo_url
- education
- organization_experience
- current_position
- vision
- mission
- work_program
- goals
- motto
- description
- is_active
- created_at
- updated_at

4. event_candidates
- id
- event_id
- candidate_id
- candidate_number
- sort_order
- created_at
- updated_at

Unique constraint:
- event_id + candidate_id
- event_id + candidate_number

5. voters
- id
- full_name
- identity_number
- phone
- email
- group_name
- unique_code
- qr_code_url
- is_anonymous
- status
- created_at
- updated_at

6. event_voters
- id
- event_id
- voter_id
- assigned_at
- has_voted
- voted_at
- status

Unique constraint:
- event_id + voter_id

7. votes
- id
- event_id
- voter_id
- submitted_at
- ip_address
- user_agent
- created_at

Unique constraint:
- event_id + voter_id

8. vote_details
- id
- vote_id
- candidate_id
- event_id
- created_at

9. audit_logs
- id
- admin_id
- action
- entity_type
- entity_id
- old_value
- new_value
- ip_address
- user_agent
- created_at

====================================================================
E. API DESIGN
====================================================================

Buat REST API seperti berikut:

AUTH:
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me

EVENT:
GET /api/admin/events
POST /api/admin/events
GET /api/admin/events/:id
PUT /api/admin/events/:id
DELETE /api/admin/events/:id
PATCH /api/admin/events/:id/status
GET /api/admin/events/:id/result

CANDIDATE:
GET /api/admin/candidates
POST /api/admin/candidates
GET /api/admin/candidates/:id
PUT /api/admin/candidates/:id
DELETE /api/admin/candidates/:id
POST /api/admin/candidates/:id/photo

EVENT CANDIDATE:
GET /api/admin/events/:id/candidates
POST /api/admin/events/:id/candidates/assign
PUT /api/admin/events/:id/candidates/reorder
DELETE /api/admin/events/:id/candidates/:candidate_id

VOTER:
GET /api/admin/voters
POST /api/admin/voters
POST /api/admin/voters/import
GET /api/admin/voters/:id
PUT /api/admin/voters/:id
DELETE /api/admin/voters/:id
POST /api/admin/voters/:id/generate-qr
GET /api/admin/voters/:id/download-qr

EVENT VOTER:
GET /api/admin/events/:id/voters
POST /api/admin/events/:id/voters/assign
POST /api/admin/events/:id/voters/import
DELETE /api/admin/events/:id/voters/:voter_id
GET /api/admin/events/:id/voters/export
GET /api/admin/events/:id/voters/qr-export

PUBLIC VOTING:
POST /api/vote/validate-code
GET /api/vote/session/:token
GET /api/vote/events/:event_id/candidates
POST /api/vote/events/:event_id/submit
GET /api/vote/events/:event_id/status

RESULT:
GET /api/admin/events/:event_id/results
GET /api/admin/events/:event_id/results/export

====================================================================
F. SECURITY RULES
====================================================================

Implementasikan security:

- Password admin harus di-hash menggunakan bcrypt.
- Admin API wajib JWT authentication.
- Public voting API tidak boleh expose data sensitif.
- Unique voter code harus random, aman, dan tidak mudah ditebak.
- Gunakan token voting session setelah QR divalidasi.
- Vote harus divalidasi di backend, jangan hanya frontend.
- Cegah double voting dengan unique constraint event_id + voter_id di table votes.
- Gunakan database transaction saat submit vote.
- Simpan audit log untuk aksi penting.
- Rate limit endpoint validasi QR dan submit vote.
- Validasi file upload foto.
- Batasi ukuran upload.
- Sanitasi input.
- CORS dikonfigurasi dengan benar.
- Jangan simpan pilihan voter secara publik jika sistem membutuhkan kerahasiaan.

====================================================================
G. FRONTEND ROUTING
====================================================================

Admin routes:

/admin/login
/admin/dashboard
/admin/events
/admin/events/create
/admin/events/:id
/admin/events/:id/edit
/admin/events/:id/candidates
/admin/events/:id/voters
/admin/events/:id/results
/admin/candidates
/admin/candidates/create
/admin/candidates/:id/edit
/admin/voters
/admin/voters/create
/admin/settings

Voting routes:

/vote
/vote/scan
/vote/session/:token
/vote/event/:eventId
/vote/event/:eventId/confirm
/vote/success
/vote/error

====================================================================
H. UI REQUIREMENTS ADMIN PAGE
====================================================================

Gunakan shadcn/ui secara konsisten.

Admin layout:

- Sidebar kiri
- Topbar
- Breadcrumb
- Responsive dashboard
- Data table
- Search input
- Filter dropdown
- Dialog create/edit
- Form validation
- Toast notification
- Loading skeleton
- Empty state
- Confirmation dialog untuk delete
- Badge status
- Pagination

Gunakan komponen:

- Button
- Input
- Textarea
- Select
- Checkbox
- Card
- Dialog
- AlertDialog
- Table
- Badge
- Tabs
- DropdownMenu
- Sheet
- Sidebar
- Form
- Toast/Sonner
- Avatar
- Separator
- Skeleton
- Progress
- Calendar/DatePicker

====================================================================
I. UI REQUIREMENTS VOTING PAGE
====================================================================

Voting Page style Neo Brutalism:

- Mobile-first
- Large readable text
- Strong border
- Bold button
- High contrast
- Candidate card mudah diklik
- Modal/drawer detail calon
- Sticky submit button di bawah
- Smooth but simple interaction

Komponen Voting Page:

- QR Scanner screen
- Candidate selection screen
- Candidate detail drawer
- Confirmation screen
- Success screen
- Error screen

Pastikan experience mobile bagus:

- Card tidak terlalu kecil
- Foto calon jelas
- Button besar
- Area klik luas
- Sticky footer untuk submit
- Loading jelas
- Error jelas

====================================================================
J. BACKEND LOGIC SUBMIT VOTE
====================================================================

Saat submit vote:

1. Terima token voting session.
2. Validasi token.
3. Ambil voter.
4. Ambil event.
5. Cek event aktif.
6. Cek voter di-assign ke event.
7. Cek voter belum voting.
8. Cek voter tidak diblokir.
9. Cek candidate_id yang dikirim memang di-assign ke event.
10. Cek jumlah pilihan:
   - Tidak kurang dari min_choices
   - Tidak lebih dari max_choices
11. Mulai database transaction.
12. Insert ke table votes.
13. Insert ke table vote_details.
14. Update event_voters.has_voted = true.
15. Update voted_at.
16. Commit transaction.
17. Return success.

Jika ada error, rollback transaction.

====================================================================
K. STRUKTUR PROJECT
====================================================================

Frontend structure:

src/
  app/
  pages/
    admin/
    vote/
  components/
    ui/
    admin/
    vote/
  layouts/
    AdminLayout.tsx
    VoteLayout.tsx
  features/
    auth/
    events/
    candidates/
    voters/
    results/
    voting/
  hooks/
  lib/
    api.ts
    utils.ts
    validations.ts
  types/
  routes/

Backend structure:

cmd/
  api/
    main.go
internal/
  config/
  database/
  middleware/
  model/
  repository/
  service/
  handler/
  dto/
  validator/
  utils/
  migration/
uploads/
  candidates/
  qrcodes/

====================================================================
L. OUTPUT YANG SAYA MAU DARI AI AGENT
====================================================================

Tolong buatkan sistem ini secara bertahap:

1. Buat struktur project frontend dan backend.
2. Buat database schema dan migration.
3. Buat backend REST API Golang.
4. Buat authentication admin.
5. Buat CRUD event.
6. Buat CRUD calon.
7. Buat upload foto calon.
8. Buat CRUD voter.
9. Buat generate unique ID dan QR Code voter.
10. Buat assign calon ke event.
11. Buat assign voter ke event.
12. Buat public voting flow.
13. Buat submit vote dengan transaction.
14. Buat halaman hasil voting.
15. Buat export data.
16. Buat UI Admin menggunakan shadcn/ui.
17. Buat UI Voting menggunakan Neo Brutalism mobile-first.
18. Buat validasi frontend dan backend.
19. Buat error handling.
20. Buat dokumentasi cara menjalankan project.

Pastikan semua kode:
- Clean
- Modular
- Type-safe
- Responsive
- Mudah dikembangkan
- Menggunakan best practice
- Tidak hardcode data
- Memiliki error handling yang jelas
- Siap untuk production improvement

Mulai dari membuat struktur folder, database schema, lalu backend API, kemudian frontend Admin Page dan Voting Page.

Catatan penting:

Jangan buat sistem voting hanya berdasarkan frontend. Semua rule voting wajib divalidasi ulang di backend.

Prioritaskan fitur inti dulu:
1. Event voting
2. Calon
3. Voter
4. Assign calon ke event
5. Assign voter ke event
6. QR Code voter
7. Public voting page
8. Submit vote
9. Hasil voting

Jangan terlalu fokus ke animasi sebelum logic utama selesai.

Untuk Admin Page wajib gunakan shadcn/ui.
Untuk Voting Page jangan gunakan style admin, tetapi gunakan Neo Brutalism yang mobile-first.

Pastikan setiap event voting bisa memiliki aturan jumlah pilihan sendiri.
Contoh:
- Event A hanya boleh pilih 1 calon.
- Event B boleh pilih maksimal 3 calon.
- Event C wajib pilih minimal 2 dan maksimal 5 calon.

Pastikan voter tidak bisa vote dua kali pada event yang sama.
Gunakan database transaction dan unique constraint untuk mencegah double vote.

Phase 1:
Setup project React + Golang + database.

Phase 2:
Buat database schema:
admins, voting_events, candidates, event_candidates, voters, event_voters, votes, vote_details, audit_logs.

Phase 3:
Buat backend auth admin dan CRUD utama.

Phase 4:
Buat Admin Page dashboard, event, calon, voter.

Phase 5:
Buat fitur assign calon dan assign voter ke event.

Phase 6:
Buat QR Code dan validasi voter.

Phase 7:
Buat Voting Page mobile-first Neo Brutalism.

Phase 8:
Buat submit vote dengan transaction.

Phase 9:
Buat hasil voting dan export.

Phase 10:
Polish UI, validasi, error handling, dan dokumentasi.