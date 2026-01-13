# DijitalKatip — Legal-Tech Dilekçe Asistanı ⚖️🖋️

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![Python](https://img.shields.io/badge/python-3.10%2B-blue)](https://www.python.org/) [![Status](https://img.shields.io/badge/status-alpha-yellow)]

Kısa açıklama: DijitalKatip, Türkiye hukuki yazışma ve TDK imla kurallarına uygun, LLM destekli bir dilekçe üretim ve yönetim platformudur. Kullanıcıdan yapılandırılmış bilgi alır, güvenlik ve gizlilik politikalarını gözeterek PDF/dilekçe çıktıları üretir. Üretim odaklı, ölçeklenebilir ve kurumsal kullanım için tasarlanmıştır.

---

## Öne çıkan özellikler ✅

- LLM tabanlı bilgi toplama ve dilekçe sentezi (chat -> yapılandırılmış JSON -> PDF)
- Şablon motoru ile kurumsal çıktılar (özelleştirilebilir header/footer/format)
- Model ve veri yönetimi için Git LFS / nesne depolama önerileri
- Güvenlik odaklı: `.env` yönetimi, audit log'lar, erişim kontrolleri
- Test ve CI ile otomatik kalite ve güvenlik kontrolleri

---

## Teknik mimari (kısa) 🔧

Basit ASCII diyagram:

```
User -> Web UI/API -> Validation/Orchestration -> LLM (inference)
                                   -> Template Renderer -> PDF Generator -> Storage (S3)
                                   -> Audit log / Metrics / DB
```

- Önerilen dağıtım: Dockerized microservice, Kubernetes (EKS/GKE/AKS), Cloud storage for artifacts.
- Model yönetimi: Büyük ağırlıklar Git LFS veya S3/Blob üzerinde saklanmalı; çalışma zamanı için güvenli model çekme politikaları uygulanmalıdır.

---

## Teknik detaylar & tavsiyeler 📌

- Python 3.10+ modern async stack (FastAPI / uvicorn), tip kontrolleri (mypy), test (pytest) ve statik analiz (ruff/flake8).
- CI: GitHub Actions veya benzeri; PR'lerde model değişiklikleri ve büyük dosya yüklemeleri kontrol edilmeli.
- Veriler: Kişisel veriler (PV/PD) mümkün olduğunda istemci tarafında maskelenmeli; sunucu tarafında sadece gerekli ihraç verisi saklanmalı.
- Logging & Monitoring: Structured logs (JSON), Prometheus ve Sentry entegrasyonu önerilir.

---

## Güvenlik ve gizlilik 🔒

- `*.env` ve kimlik bilgileri repo'da saklanmamalıdır; secrets manager (AWS Secrets Manager/GCP Secret Manager) veya Vault kullanılmalıdır.
- Dilekçe içeriği ve kullanıcı verileri için retention politikası uygulanmalı; gerektiğinde otomatik silme ve denetim izleri aktifleştirilmeli.
- Model içi duyarlı veri çıkarımı riskleri için prompt ve input sanitization uygulanmalıdır.

---

## Katkıda bulunma & Kod kalitesi 🤝

- PR başlıkları, test ekleme zorunluluğu ve değişiklik beyanı (changelog/release notes) gereklidir.
- Commit mesajları öz ve açıklayıcı olmalı (conventional commits tercih edilir).
- README'de proje hedefleri, issue/PR şablonları ve CONTRIBUTING.md bağlantısı yer almalıdır (varsa ayrı dosya olarak ekleyin).

---

## Lisans & İletişim

Bu proje MIT lisansı altında lisanslanmıştır. Ayrıntılar için `LICENSE` dosyasına bakınız.

Sorular/iş birlikleri için: yigit.turkkan@gmail.com
