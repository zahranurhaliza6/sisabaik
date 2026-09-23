"use strict";

const rupiah = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
});

document.addEventListener("DOMContentLoaded", () => {
    siapkanKatalog();
    siapkanValidasiPenawaran();
});

async function siapkanKatalog() {
    const wadah = document.querySelector("#daftar-penawaran");

    if (!wadah) {
        return;
    }

    const elemen = ambilElemenKatalog();

    try {
        const penawaran = await ambilDataPenawaran();
        pasangFilter(elemen, penawaran, wadah);
        tampilkanPenawaran(penawaran, elemen, wadah);
    } catch (error) {
        tampilkanError(elemen.status);
        console.error("Gagal memuat penawaran:", error);
    }
}

function ambilElemenKatalog() {
    return {
        status: document.querySelector("#status-katalog"),
        inputCari: document.querySelector("#kata-kunci"),
        pilihKategori: document.querySelector("#filter-kategori")
    };
}

async function ambilDataPenawaran() {
    const respons = await fetch("data/penawaran.json");

    if (!respons.ok) {
        throw new Error(`HTTP ${respons.status}`);
    }

    return respons.json();
}

function pasangFilter(elemen, penawaran, wadah) {
    const perbarui = () => {
        tampilkanPenawaran(penawaran, elemen, wadah);
    };

    elemen.inputCari.addEventListener("input", perbarui);
    elemen.pilihKategori.addEventListener("change", perbarui);
}

function tampilkanPenawaran(penawaran, elemen, wadah) {
    const hasil = filterPenawaran(penawaran, elemen);
    renderKartu(hasil, wadah, elemen.status);
}

function filterPenawaran(penawaran, elemen) {
    const kata = elemen.inputCari.value.trim().toLowerCase();
    const kategori = elemen.pilihKategori.value;

    return penawaran.filter((item) => {
        return cocokDenganPencarian(item, kata)
            && cocokDenganKategori(item, kategori);
    });
}

function cocokDenganPencarian(item, kata) {
    const teks = `${item.nama} ${item.penyedia}`.toLowerCase();

    return teks.includes(kata);
}

function cocokDenganKategori(item, kategori) {
    return kategori === "semua" || item.kategori === kategori;
}

function renderKartu(data, wadah, status) {
    wadah.replaceChildren();

    status.textContent =
        `${data.length} penawaran ditemukan.`;

    data.forEach((item) => {
        const artikel = buatKartu(item);
        wadah.append(artikel);
    });
}

function buatKartu(item) {
    const artikel = document.createElement("article");

    artikel.className = "offer-card";
    artikel.innerHTML = buatIsiKartu(item);

    pasangTombolKartu(artikel, item);

    return artikel;
}

function buatIsiKartu(item) {
    const harga = formatHargaPenawaran(item);

    return `
        <div
            class="offer-card__visual"
            aria-hidden="true"
        ></div>

        <div class="offer-card__content">
            <span class="badge">
                ${item.labelKategori}
            </span>

            <h3>${item.nama}</h3>

            <p class="offer-card__meta">
                ${item.penyedia}
                ·
                ${item.stok}
                ${item.satuan}
            </p>

            <p class="offer-card__price">
                <del>
                    ${rupiah.format(item.hargaNormal)}
                </del>

                <strong>
                    ${harga}
                </strong>
            </p>

            <button
                class="button"
                type="button"
                data-id="${item.id}"
            >
                Tambah
            </button>
        </div>
    `;
}

function formatHargaPenawaran(item) {
    if (item.hargaPenawaran === 0) {
        return "Tanpa biaya";
    }

    return rupiah.format(item.hargaPenawaran);
}

function pasangTombolKartu(artikel, item) {
    const tombol = artikel.querySelector("button");

    tombol.addEventListener("click", () => {
        tambahKeKeranjang(item);
    });
}

const keranjang = [];

function tambahKeKeranjang(item) {
    keranjang.push(item);
    perbaruiRingkasan();
}

function perbaruiRingkasan() {
    const jumlah = document.querySelector("#jumlah-item");
    const total = document.querySelector("#total-pesanan");

    if (jumlah) {
        jumlah.textContent = keranjang.length;
    }

    if (total) {
        total.textContent = rupiah.format(hitungTotal());
    }
}

function hitungTotal() {
    return keranjang.reduce(
        (jumlah, item) => jumlah + item.hargaPenawaran,
        0
    );
}

function tampilkanError(status) {
    if (!status) {
        return;
    }

    status.textContent =
        "Data gagal dimuat. Jalankan proyek melalui server lokal.";

    status.classList.add("error-message");
}

function siapkanValidasiPenawaran() {
    const form = document.querySelector("#form-penawaran");

    if (!form) {
        return;
    }

    const normal = form.querySelector("#harga-normal");
    const penawaran = form.querySelector("#harga-pemulihan");

    pasangValidasiHarga(form, normal, penawaran);
}

function pasangValidasiHarga(form, normal, penawaran) {
    const validasi = () => {
        validasiHarga(normal, penawaran);
    };

    normal.addEventListener("input", validasi);
    penawaran.addEventListener("input", validasi);
    form.addEventListener("submit", validasiForm);
}

function validasiHarga(normal, penawaran) {
    const hargaNormal = Number(normal.value);
    const hargaPenawaran = Number(penawaran.value);

    const pesan =
        hargaPenawaran > hargaNormal
            ? "Harga penawaran tidak boleh melebihi harga normal."
            : "";

    penawaran.setCustomValidity(pesan);
}

function validasiForm(event) {
    const form = event.currentTarget;

    if (!form.checkValidity()) {
        event.preventDefault();
        form.reportValidity();
    }
}