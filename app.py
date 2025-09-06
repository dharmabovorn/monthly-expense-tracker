import streamlit as st
import pandas as pd
import plotly.express as px
from fpdf import FPDF
import base64
from datetime import datetime
from streamlit_option_menu import option_menu

# Page configuration
st.set_page_config(
    page_title="Expense Tracker",
    page_icon="💰",
    layout="wide"
)

# Initialize session state for expenses and income
if 'expenses' not in st.session_state:
    st.session_state.expenses = pd.DataFrame(columns=["Date", "Category", "Description", "Amount"])
if 'monthly_income' not in st.session_state:
    st.session_state.monthly_income = 0.0

# Sidebar for navigation
with st.sidebar:
    st.title("💰 Expense Tracker")
    selected = option_menu(
        menu_title="Menu",
        options=["Dashboard", "Add Expense", "View Expenses", "Export Data"],
        icons=["speedometer", "plus-circle", "list-ul", "download"],
        default_index=0,
    )

# Format currency
def format_currency(amount):
    return "${:,.2f}".format(amount)

# Dashboard Page
if selected == "Dashboard":
    st.title("💰 Expense Dashboard")
    
    # Income input
    with st.expander("💵 Set Monthly Income"):
        income = st.number_input(
            "Enter your monthly income:", 
            min_value=0.0, 
            value=float(st.session_state.monthly_income),
            step=100.0,
            format="%.2f"
        )
        if st.button("Update Income"):
            st.session_state.monthly_income = income
            st.success(f"Monthly income updated to {format_currency(income)}")
    
    # Calculate totals
    total_expenses = st.session_state.expenses["Amount"].sum()
    remaining_balance = st.session_state.monthly_income - total_expenses
    
    # Display metrics
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Monthly Income", format_currency(st.session_state.monthly_income))
    with col2:
        st.metric("Total Expenses", format_currency(total_expenses))
    with col3:
        st.metric("Remaining Balance", format_currency(remaining_balance), 
                 delta_color="inverse" if remaining_balance < 0 else "normal")
    
    # Expense distribution chart
    if not st.session_state.expenses.empty:
        st.subheader("Expense Distribution by Category")
        category_totals = st.session_state.expenses.groupby("Category")["Amount"].sum().reset_index()
        fig = px.pie(category_totals, values="Amount", names="Category", 
                    title="Expense Distribution by Category")
        st.plotly_chart(fig, use_container_width=True)
    
    # Recent transactions
    st.subheader("Recent Transactions")
    if not st.session_state.expenses.empty:
        st.dataframe(st.session_state.expenses.sort_values("Date", ascending=False).head(5))
    else:
        st.info("No transactions yet. Add some expenses to see them here!")

# Add Expense Page
elif selected == "Add Expense":
    st.title("➕ Add New Expense")
    
    with st.form("expense_form"):
        # Form inputs
        date = st.date_input("Date", datetime.now().date())
        category = st.selectbox(
            "Category",
            ["Food", "Transportation", "Housing", "Entertainment", 
             "Utilities", "Shopping", "Healthcare", "Other"]
        )
        description = st.text_input("Description")
        amount = st.number_input("Amount", min_value=0.01, step=0.01, format="%.2f")
        
        # Submit button
        submitted = st.form_submit_button("Add Expense")
        if submitted:
            if not description:
                st.error("Please enter a description for the expense.")
            else:
                new_expense = pd.DataFrame({
                    "Date": [date],
                    "Category": [category],
                    "Description": [description],
                    "Amount": [amount]
                })
                st.session_state.expenses = pd.concat([st.session_state.expenses, new_expense], ignore_index=True)
                st.success(f"Added expense of {format_currency(amount)} for {description}")

# View Expenses Page
elif selected == "View Expenses":
    st.title("📋 All Expenses")
    
    if not st.session_state.expenses.empty:
        # Filter options
        col1, col2 = st.columns(2)
        with col1:
            category_filter = st.multiselect(
                "Filter by Category",
                options=st.session_state.expenses["Category"].unique(),
                default=st.session_state.expenses["Category"].unique()
            )
        with col2:
            date_range = st.date_input(
                "Date Range",
                value=(
                    st.session_state.expenses["Date"].min(),
                    st.session_state.expenses["Date"].max()
                ),
                min_value=st.session_state.expenses["Date"].min(),
                max_value=st.session_state.expenses["Date"].max()
            )
        
        # Apply filters
        filtered_expenses = st.session_state.expenses[
            (st.session_state.expenses["Category"].isin(category_filter)) &
            (st.session_state.expenses["Date"] >= pd.to_datetime(date_range[0])) &
            (st.session_state.expenses["Date"] <= pd.to_datetime(date_range[1] if len(date_range) > 1 else date_range[0]))
        ]
        
        # Display filtered expenses
        st.dataframe(
            filtered_expenses.sort_values("Date", ascending=False),
            column_config={
                "Date": st.column_config.DateColumn("Date"),
                "Amount": st.column_config.NumberColumn("Amount", format="$%.2f")
            },
            use_container_width=True
        )
        
        # Summary statistics
        st.subheader("Summary")
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Total Expenses", format_currency(filtered_expenses["Amount"].sum()))
        with col2:
            st.metric("Number of Transactions", len(filtered_expenses))
        with col3:
            avg_expense = filtered_expenses["Amount"].mean() if not filtered_expenses.empty else 0
            st.metric("Average Expense", format_currency(avg_expense))
    else:
        st.info("No expenses recorded yet. Add some expenses to see them here!")

# Export Data Page
elif selected == "Export Data":
    st.title("📤 Export Data")
    
    if st.session_state.expenses.empty:
        st.warning("No data to export. Please add some expenses first.")
    else:
        # CSV Export
        st.subheader("Export to CSV")
        csv = st.session_state.expenses.to_csv(index=False)
        b64 = base64.b64encode(csv.encode()).decode()
        href = f'<a href="data:file/csv;base64,{b64}" download="expenses_{datetime.now().strftime("%Y%m%d")}.csv">Download CSV File</a>'
        st.markdown(href, unsafe_allow_html=True)
        
        # PDF Export
        st.subheader("Export to PDF")
        if st.button("Generate PDF Report"):
            # Create PDF
            pdf = FPDF()
            pdf.add_page()
            
            # Add title
            pdf.set_font("Arial", 'B', 16)
            pdf.cell(0, 10, "Expense Report", 0, 1, 'C')
            pdf.ln(10)
            
            # Add summary
            pdf.set_font("Arial", 'B', 12)
            pdf.cell(0, 10, f"Monthly Income: {format_currency(st.session_state.monthly_income)}", 0, 1)
            total_expenses = st.session_state.expenses["Amount"].sum()
            pdf.cell(0, 10, f"Total Expenses: {format_currency(total_expenses)}", 0, 1)
            remaining = st.session_state.monthly_income - total_expenses
            pdf.cell(0, 10, f"Remaining Balance: {format_currency(remaining)}", 0, 1)
            pdf.ln(10)
            
            # Add expenses table
            pdf.set_font("Arial", 'B', 12)
            pdf.cell(0, 10, "Expense Details", 0, 1)
            pdf.set_font("Arial", 'B', 10)
            pdf.cell(40, 10, "Date", 1, 0, 'C')
            pdf.cell(40, 10, "Category", 1, 0, 'C')
            pdf.cell(80, 10, "Description", 1, 0, 'C')
            pdf.cell(30, 10, "Amount", 1, 1, 'C')
            
            pdf.set_font("Arial", '', 10)
            for _, row in st.session_state.expenses.iterrows():
                pdf.cell(40, 10, str(row["Date"]), 1, 0, 'L')
                pdf.cell(40, 10, row["Category"], 1, 0, 'L')
                pdf.cell(80, 10, row["Description"][:50], 1, 0, 'L')
                pdf.cell(30, 10, format_currency(row["Amount"]), 1, 1, 'R')
            
            # Save to a temporary file and create download link
            import tempfile
            import os
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
                pdf.output(tmp.name)
                with open(tmp.name, 'rb') as f:
                    pdf_bytes = f.read()
                os.unlink(tmp.name)
            
            b64 = base64.b64encode(pdf_bytes).decode()
            href = f'<a href="data:application/pdf;base64,{b64}" download="expense_report_{datetime.now().strftime("%Y%m%d")}.pdf">Download PDF Report</a>'
            st.markdown(href, unsafe_allow_html=True)

# Add some custom CSS for better styling
st.markdown("""
    <style>
    .stButton>button {
        background-color: #4CAF50;
        color: white;
        border: none;
        padding: 10px 20px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 4px 2px;
        cursor: pointer;
        border-radius: 5px;
    }
    .stButton>button:hover {
        background-color: #45a049;
    }
    .stSelectbox, .stTextInput, .stNumberInput, .stDateInput {
        margin-bottom: 1rem;
    }
    .stAlert {
        border-radius: 5px;
    }
    </style>
""", unsafe_allow_html=True)
