import Foundation
import SwiftUI

// --- Models ---

struct Topping: Identifiable, Codable {
    let id: String
    let name: String
    let price: Double
}

struct OrderItem: Identifiable, Codable {
    var id = UUID()
    let productId: String
    let quantity: Int
    var product: Product?
    var toppings: [Topping] = []
    var notes: String = ""
}

struct CustomerInfo: Codable {
    var name: String = ""
    var phone: String = ""
}

// --- View Models ---

class POSViewModel: ObservableObject {
    @Published var products: [Product] = []
    @Published var orders: [Order] = []
    @Published var cart: [OrderItem] = []
    @Published var isBusyMode: Bool = false
    @Published var todayRevenue: Double = 0
    @Published var toppings: [Topping] = []
    
    // Gestures & Editing
    func updateProductName(id: String, newName: String) {
        if let index = products.firstIndex(where: { $0.id == id }) {
            products[index].name = newName
        }
    }
}

// --- UI Components ---

struct SwipeableProductRow: View {
    let product: Product
    @State private var offset: CGFloat = 0
    
    var body: some View {
        HStack {
            ProductCard(product: product) {}
        }
        .offset(x: offset)
        .gesture(
            DragGesture()
                .onChanged { gesture in
                    offset = gesture.translation.width
                }
                .onEnded { _ in
                    if offset < -100 {
                        // Action for left swipe (e.g. Delete)
                    } else if offset > 100 {
                        // Action for right swipe (e.g. Favorite)
                    }
                    withAnimation { offset = 0 }
                }
        )
    }
}

struct EditableText: View {
    @State var text: String
    @State private var isEditing = false
    let onCommit: (String) -> Void
    
    var body: some View {
        if isEditing {
            TextField("Name", text: $text, onCommit: {
                isEditing = false
                onCommit(text)
            })
            .textFieldStyle(RoundedBorderTextFieldStyle())
        } else {
            Text(text)
                .onLongPressGesture {
                    isEditing = true
                }
        }
    }
}

// --- Checkout & Tip UI ---

struct CheckoutView: View {
    @ObservedObject var viewModel: POSViewModel
    @State private var customer = CustomerInfo()
    @State private var tip: Double = 0
    @State private var showThankYou = false
    @State private var thankYouMessage = ""
    
    let tipOptions: [Double] = [5000, 10000, 20000]
    
    var body: some View {
        VStack(spacing: 24) {
            Text("Checkout").font(.title).bold()
            
            VStack(spacing: 12) {
                TextField("Customer Name", text: $customer.name)
                    .padding().background(Color.black.opacity(0.05)).cornerRadius(12)
                TextField("Phone Number", text: $customer.phone)
                    .padding().background(Color.black.opacity(0.05)).cornerRadius(12)
            }
            
            VStack(alignment: .leading) {
                Text("ADD A TIP").font(.caption).bold().foregroundColor(.secondary)
                HStack {
                    ForEach(tipOptions, id: \.self) { opt in
                        Button("\(Int(opt/1000))k") {
                            tip = opt
                        }
                        .padding().background(tip == opt ? Color.black : Color.black.opacity(0.05))
                        .foregroundColor(tip == opt ? .white : .black)
                        .cornerRadius(12)
                    }
                }
            }
            
            Button("COMPLETE PAYMENT") {
                // Logic for thank you message
                if tip >= 20000 { thankYouMessage = "Wow! Thank you for your amazing generosity! ❤️" }
                else { thankYouMessage = "Thank you very much!" }
                showThankYou = true
            }
            .frame(maxWidth: .infinity)
            .padding().background(Color.black).foregroundColor(.white).cornerRadius(16)
        }
        .padding()
        .alert(isPresented: $showThankYou) {
            Alert(title: Text("Success"), message: Text(thankYouMessage), dismissButton: .default(Text("OK")))
        }
    }
}

// --- UI Components ---

struct ProductCard: View {
    let product: Product
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(alignment: .center, spacing: 8) {
                AsyncImage(url: URL(string: product.image)) { img in
                    img.resizable().aspectRatio(contentMode: .fill)
                } placeholder: {
                    Color.gray.opacity(0.1)
                }
                .frame(width: 80, height: 80)
                .cornerRadius(12)
                
                Text(product.name)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.primary)
                
                Text("\(Int(product.price/1000))k")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.primary)
            }
            .padding()
            .frame(maxWidth: .infinity)
            .background(Color.white)
            .cornerRadius(20)
            .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
        }
    }
}

// --- Main Screens ---

struct CashierView: View {
    @ObservedObject var viewModel: POSViewModel
    @State private var selectedCategory = "All"
    let categories = ["All", "Season", "Cold Brew", "Espresso & Coffee"]
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text("Kalim Coffee")
                        .font(.system(size: 24, weight: .bold))
                    Spacer()
                    Label("Alice Barista", systemImage: "person.circle")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(categories, id: \.self) { cat in
                            Button(action: { selectedCategory = cat }) {
                                Text(cat)
                                    .font(.system(size: 14, weight: .medium))
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(selectedCategory == cat ? Color.black : Color.black.opacity(0.05))
                                    .foregroundColor(selectedCategory == cat ? .white : .black)
                                    .cornerRadius(20)
                            }
                        }
                    }
                }
            }
            .padding()
            .background(Color.white)
            
            // Grid
            ScrollView {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                    ForEach(viewModel.products) { product in
                        ProductCard(product: product) {
                            viewModel.addToCart(product: product)
                        }
                    }
                }
                .padding()
            }
            
            // Footer
            VStack(spacing: 16) {
                HStack {
                    VStack(alignment: .leading) {
                        Text("TOTAL AMOUNT")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.secondary)
                        Text("\(Int(viewModel.cart.reduce(0) { $0 + ($1.product?.price ?? 0) * Double($1.quantity) } / 1000))k")
                            .font(.system(size: 24, weight: .bold))
                    }
                    Spacer()
                    Button(action: viewModel.charge) {
                        Text("CHARGE")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.white)
                            .frame(width: 160, height: 56)
                            .background(Color.black)
                            .cornerRadius(16)
                    }
                }
            }
            .padding()
            .background(Color.white)
            .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: -5)
        }
        .background(Color(red: 0.97, green: 0.97, blue: 0.96))
    }
}

struct BarStationView: View {
    @ObservedObject var viewModel: POSViewModel
    @State private var selectedStatus: OrderStatus = .wait
    
    var body: some View {
        VStack(spacing: 0) {
            Text("Bar Station")
                .font(.title2).bold()
                .padding()
            
            Picker("Status", selection: $selectedStatus) {
                ForEach(OrderStatus.allCases, id: \.self) { status in
                    Text(status.rawValue).tag(status)
                }
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding()
            
            ScrollView {
                VStack(spacing: 16) {
                    ForEach(viewModel.orders.filter { $0.status == selectedStatus }) { order in
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text(order.customerName).bold()
                                Spacer()
                                if order.status != .ready {
                                    Label("\(order.estimatedTime)m", systemImage: "clock")
                                        .font(.caption).bold()
                                        .foregroundColor(.orange)
                                }
                            }
                            
                            Divider()
                            
                            ForEach(order.items) { item in
                                HStack {
                                    Text(item.product?.name ?? "Unknown")
                                    Spacer()
                                    Text("x\(item.quantity)").bold()
                                }
                                .font(.subheadline)
                            }
                            
                            if order.status == .wait {
                                Button("Start Preparing") {
                                    // Update status logic
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue.opacity(0.1))
                                .foregroundColor(.blue)
                                .cornerRadius(12)
                            }
                        }
                        .padding()
                        .background(Color.white)
                        .cornerRadius(20)
                        .shadow(radius: 2)
                    }
                }
                .padding()
            }
        }
    }
}

struct CommandCenterView: View {
    @ObservedObject var viewModel: POSViewModel
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                Text("Management").font(.largeTitle).bold()
                
                VStack(alignment: .leading, spacing: 16) {
                    Text("NET CASH FLOW").font(.caption).bold().foregroundColor(.white.opacity(0.6))
                    Text("\(Int(viewModel.todayRevenue/1000))k VND").font(.system(size: 36, weight: .bold))
                    
                    HStack {
                        Button("Tax AI") {}.padding(.horizontal).padding(.vertical, 8).background(Color.white.opacity(0.2)).cornerRadius(12)
                        Button("Report") {}.padding(.horizontal).padding(.vertical, 8).background(Color.white.opacity(0.2)).cornerRadius(12)
                    }
                }
                .padding(32)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.black)
                .foregroundColor(.white)
                .cornerRadius(32)
                
                Toggle("Busy Mode", isOn: $viewModel.isBusyMode)
                    .padding()
                    .background(Color.white)
                    .cornerRadius(16)
                
                Text("Menu Management").font(.headline)
                // Grid of products with "New" tags...
            }
            .padding()
        }
    }
}

struct MainTabView: View {
    @StateObject var viewModel = POSViewModel()
    
    var body: some View {
        TabView {
            CashierView(viewModel: viewModel)
                .tabItem { Label("Cashier", systemImage: "square.grid.2x2") }
            
            BarStationView(viewModel: viewModel)
                .tabItem { Label("Bar", systemImage: "cup.and.saucer") }
            
            CommandCenterView(viewModel: viewModel)
                .tabItem { Label("Command", systemImage: "chart.bar") }
        }
        .accentColor(.black)
    }
}
